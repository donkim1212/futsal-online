import express from "express";
import { userPrisma, playerPrisma } from "../lib/utils/prisma/index.js";
import ua from "../middlewares/auths/user.authenticator.js";
import uv from "../middlewares/validators/user-validator.middleware.js";
import ec from "../lib/errors/error-checker.js";
import tierUtils from "../lib/utils/tier-utils.js";

const router = express.Router();

const POINTS = 10;
const MODIFIERS = {
  speed: 0.1,
  goalRate: 0.25,
  power: 0.15,
  defense: 0.3,
  stamina: 0.2,
};

/**
 * Calculate team's total power based on team members' stats multiplied by a preset MODIFIERS.
 * @deprecated Use calcTeamPowerEx instead.
 * @param {Object} team team data from 'team' table in 'games_db'
 * @returns team's tp (total power to be compared for)
 */
const calcTeamPower = async (team) => {
  let tp = 0;
  for (let member in team) {
    const player = await ec.playerChecker(team[member].Inventory.PlayerId);
    const tier = await playerPrisma.tier.findUnique({
      where: { tierName: player.TierName },
    });
    tp +=
      (player.speed + tier.bonus[`${team[member].Inventory.level}`]) *
        MODIFIERS.speed +
      (player.goalRate + tier.bonus[`${team[member].Inventory.level}`]) *
        MODIFIERS.goalRate +
      (player.power + tier.bonus[`${team[member].Inventory.level}`]) *
        MODIFIERS.power +
      (player.defense + tier.bonus[`${team[member].Inventory.level}`]) *
        MODIFIERS.defense +
      (player.stamina + tier.bonus[`${team[member].Inventory.level}`]) *
        MODIFIERS.stamina;
  }
  return tp;
};

/**
 * Calculate team's total power based on team members' stats multiplied by a preset MODIFIERS.
 * @param {Object} team team data from 'team' table in 'games_db'
 * @returns team's tp (total power to be compared for)
 */
const calcTeamPowerEx = async (team) => {
  const inventories = await userPrisma.$queryRaw`
    SELECT iv.level,
      iv.player_id as playerId,
      pl.speed,
      pl.goal_rate as goalRate,
      pl.power,
      pl.defense,
      pl.stamina,
      pl.tier_name as tierName
    FROM game_db.Inventory iv
    JOIN player_db.Player pl
    ON iv.player_id=pl.player_id
    WHERE iv.inventory_id=${team[0].InventoryId}
      OR iv.inventory_id=${team[1].InventoryId}
      OR iv.inventory_id=${team[2].InventoryId}
  `;

  let tp = 0;
  for (let member in inventories) {
    await tierUtils.applyActualPlayerStats(inventories[member]);
    tp +=
      inventories[member].speed * MODIFIERS.speed +
      inventories[member].goalRate * MODIFIERS.goalRate +
      inventories[member].power * MODIFIERS.power +
      inventories[member].defense * MODIFIERS.defense +
      inventories[member].stamina * MODIFIERS.stamina;
  }
  return tp;
};

const getSign = (number) => {
  if (number > 0) return 1;
  else if (number < 0) return -1;
  else return 0;
};

const play = async (myId, opId) => {
  const me = await ec.userChecker(myId);
  const opponent = await ec.userChecker(opId);
  const myTeam = await ec.teamChecker(myId);
  const opTeam = await ec.teamChecker(opId);
  const myTeamPower = await calcTeamPowerEx(myTeam);
  const opTeamPower = await calcTeamPowerEx(opTeam);
  const randomNumber = Math.random() * (myTeamPower + opTeamPower);
  const result = getSign(myTeamPower - randomNumber);

  if (result == 0) return 0;
  await userPrisma.user.update({
    where: { userId: me.userId },
    data: {
      rating: {
        increment: POINTS * result,
      },
    },
  });
  await userPrisma.user.update({
    where: { userId: opponent.userId },
    data: {
      rating: {
        increment: POINTS * -result,
      },
    },
  });
  return result;
};

const matchMaking = async (myUserId) => {
  const me = await ec.userChecker(myUserId);
  const opponent = await userPrisma.$queryRaw`
    SELECT *
    FROM MatchQueue mq
    INNER JOIN User u
    ON mq.user_id=u.user_id
    ORDER BY ABS(u.rating - ${me.rating})
    LIMIT 10
  `;
  if (opponent.length < 2) throw new Error("상대를 찾을 수 없습니다.");
  const index = Math.trunc(Math.random() * (opponent.length - 1)) + 1;
  return opponent[index];
};

const matchResultResponse = (result, res, myId, opponentId) => {
  if (result === 0)
    return res
      .status(200)
      .json({ message: `userId ${opponentId} 과(와)의 승부에서 비겼습니다.` });
  else if (result > 0)
    return res.status(200).json({
      message: `userId ${opponentId} 과(와)의 승부에서 승리했습니다!`,
    });
  else
    return res.status(200).json({
      message: `userId ${opponentId} 과(와)의 승부에서 패배했습니다.`,
    });
};

router.post(
  "/games/versus/:userId",
  ua.authStrict,
  uv.userIdParamsValidation,
  async (req, res, next) => {
    try {
      const result = await play(req.body.user.userId, req.params.userId);
      return matchResultResponse(
        result,
        res,
        req.body.user.userId,
        req.params.userId,
      );
    } catch (err) {
      next(err);
    }
  },
);

//
router.post("/games/matchmaking", ua.authStrict, async (req, res, next) => {
  try {
    const opponent = await matchMaking(req.body.user.userId);
    const result = await play(req.body.user.userId, opponent.user_id);
    return matchResultResponse(
      result,
      res,
      req.body.user.userId,
      opponent.user_id,
    );
  } catch (err) {
    next(err);
  }
});

export default router;
