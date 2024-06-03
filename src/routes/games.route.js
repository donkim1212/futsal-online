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
    const member = await ec.inventoryChecker();
    acc +=
      member.speed * MODIFIERS.speed +
      goalRate * MODIFIERS.goalRate +
      power * MODIFIERS.power +
      defense * MODIFIERS.defense +
      stamina * MODIFIERS;
  }, 0);
};

const play = async (myTeam, opTeam) => {
  const myTeamPower = calcTeamPower(myTeam);
  const opTeamPower = calcTeamPower(opTeam);
  return myTeamPower - opTeamPower;
};

const matchMaking = () => {};

router.post("/games/play/:userId", ua.authStrict, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const me = await ec.userChecker(req.body.userId);
    const opponent = await ec.userChecker(userId);
    const myTeam = await ec.teamChecker(req.body.user.userId);
    const opTeam = await ec.teamChecker(userId);
    const result = play(myTeam, opTeam);
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
