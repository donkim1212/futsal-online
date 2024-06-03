import express from "express";
import { userPrisma, playerPrisma } from "../lib/utils/prisma/index.js";
import ua from "../middlewares/auths/user.authenticator.js";
import ec from "../lib/errors/error-checker.js";

const router = express.Router();

const POINTS = 10;
const MODIFIERS = {
  speed: 0.1,
  goalRate: 0.25,
  power: 0.15,
  defense: 0.3,
  stamina: 0.2,
};

const calcTeamPower = async (team) => {
  return team.reduce(async (acc, member) => {
    const inventory = await userPrisma.inventory.findFirst({
      where: { InventoryId: member.InventoryId },
    });
    const player = await ec.playerChecker(inventory.PlayerId);
    const tier = await playerPrisma.tier.findUnique({
      // player.tier
    });
    acc +=
      member.speed * MODIFIERS.speed +
      member.goalRate * MODIFIERS.goalRate +
      member.power * MODIFIERS.power +
      member.defense * MODIFIERS.defense +
      member.stamina * MODIFIERS;
  }, 0);
};

const play = async (me, opponent) => {
  const me = await ec.userChecker(req.body.userId);
  const opponent = await ec.userChecker(userId);
  const myTeam = await ec.teamChecker(req.body.user.userId);
  const opTeam = await ec.teamChecker(userId);
  const myTeamPower = calcTeamPower(myTeam);
  const opTeamPower = calcTeamPower(opTeam);
  if (myTeamPower == opTeamPower) return 0;
  const sign = myTeamPower - opTeamPower;
  userPrisma.user.update({
    where: { userId: me },
    data: {
      rating: {
        increment: POINTS * sign,
      },
    },
  });
  userPrisma.update({
    where: { userId: opponent },
    data: {
      rating: {
        increment: POINTS * -sign,
      },
    },
  });
  return sign;
};

const matchMaking = () => {};

router.post("/games/play/:userId", ua.authStrict, async (req, res, next) => {
  try {
    const result = play(req.body.user.userId, req.params.userId);
    if (result == 0) res.status(200).json({ message: "무승부입니다." });
    else if (result > 0) res.status(200).json({ message: "승리했습니다!" });
    else res.status(200).json({ message: "패배했습니다." });
  } catch (err) {
    next(err);
  }
});

//
router.post("/games/matchmaking", ua.authStrict, async (req, res, next) => {
  try {
    //
  } catch (err) {
    next(err);
  }
});

export default router;
