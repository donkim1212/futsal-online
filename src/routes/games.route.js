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
  const myTeam = await ec.teamChecker(myId);
  const opTeam = await ec.teamChecker(opId);
  const myTeamPower = await calcTeamPowerEx(myTeam);
  const opTeamPower = await calcTeamPowerEx(opTeam);
  const totalGoals = Math.round(
    (Math.random() * Math.abs(myTeamPower - opTeamPower)) / 10 +
      Math.floor(Math.random() * 3),
  );

  const score = [0, 0];
  for (let i = 0; i < totalGoals; i++) {
    const randomNumber = Math.random() * (myTeamPower + opTeamPower);
    const sign = getSign(myTeamPower - randomNumber);
    if (sign > 0) score[0]++;
    else if (sign < 0) score[1]++;
  }

  return score;
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

const matchResultResponse = async (score, res, myId, opId) => {
  const result = getSign(score[0] - score[1]);
  await userPrisma.$transaction(async (tx) => {
    await tx.matchHistory.create({
      data: {
        myUserId: myId,
        opUserId: opId,
        score1: score[0],
        score2: score[1],
      },
    });
    const myData = {
      rating: { increment: POINTS * result },
    };
    const opData = {
      rating: { increment: POINTS * -result },
    };

    if (result > 0) {
      myData.wins = { increment: 1 };
      opData.loses = { increment: 1 };
    } else if (result < 0) {
      myData.loses = { increment: 1 };
      opData.wins = { increment: 1 };
    } else {
      myData.draws = { increment: 1 };
      opData.draws = { increment: 1 };
    }

    await tx.user.update({
      where: { userId: myId },
      data: { ...myData },
    });
    await tx.user.update({
      where: { userId: opId },
      data: { ...opData },
    });
  });

  const data = {};
  if (result === 0) {
    data.message = `userId ${opId} 과(와)의 승부에서 비겼습니다.`;
  } else if (result > 0)
    data.message = `userId ${opId} 과(와)의 승부에서 승리했습니다!`;
  else {
    data.message = `userId ${opId} 과(와)의 승부에서 패배했습니다.`;
  }
  data.data = {
    score: `${score[0]} : ${score[1]}`,
  };
  return res.status(200).json(data);
};

router.post(
  "/games/versus/:userId",
  ua.authStrict,
  uv.userIdParamsValidation,
  async (req, res, next) => {
    try {
      const score = await play(req.body.user.userId, req.params.userId);
      return await matchResultResponse(
        score,
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
    const score = await play(req.body.user.userId, opponent.user_id);
    return await matchResultResponse(
      score,
      res,
      req.body.user.userId,
      opponent.user_id,
    );
  } catch (err) {
    next(err);
  }
});

export default router;
