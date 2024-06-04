import express from "express";
import { userPrisma, playerPrisma } from "../lib/utils/prisma/index.js";
import ua from "../middlewares/auths/user.authenticator.js";
import uv from "../middlewares/validators/user-validator.middleware.js";
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
      where: { tierName: player.tierName },
    });

    acc +=
      (player.speed + tier.bonus[`${inventory.level}`]) * MODIFIERS.speed +
      (player.goalRate + tier.bonus[`${inventory.level}`]) *
        MODIFIERS.goalRate +
      (player.power + tier.bonus[`${inventory.level}`]) * MODIFIERS.power +
      (player.defense + tier.bonus[`${inventory.level}`]) * MODIFIERS.defense +
      (player.stamina + tier.bonus[`${inventory.level}`]) * MODIFIERS.stamina;
  }, 0);
};

const getSign = (number) => {
  if (number > 0) return 1;
  else if (number < 0) return -1;
  else 0;
};

const play = async (a, b) => {
  const me = await ec.userChecker(a);
  const opponent = await ec.userChecker(b);
  const myTeam = await ec.teamChecker(a);
  const opTeam = await ec.teamChecker(b);
  const myTeamPower = calcTeamPower(myTeam);
  const opTeamPower = calcTeamPower(opTeam);

  const sum = myTeamPower + opTeamPower;
  const result = getSign(myTeamPower - Math.random() * sum);

  if (result == 0) return 0;
  await userPrisma.user.update({
    where: { userId: me },
    data: {
      rating: {
        increment: POINTS * result,
      },
    },
  });
  await userPrisma.update({
    where: { userId: opponent },
    data: {
      rating: {
        increment: POINTS * -result,
      },
    },
  });
  return result;
};

const matchMaking = () => {};

router.post(
  "/games/versus/:userId",
  ua.authStrict,
  uv.userIdParamsValidation,
  async (req, res, next) => {
    try {
      const result = play(req.body.user.userId, req.params.userId);
      if (result == 0)
        return res.status(200).json({ message: "무승부입니다." });
      else if (result > 0)
        return res.status(200).json({ message: "승리했습니다!" });
      else return res.status(200).json({ message: "패배했습니다." });
    } catch (err) {
      next(err);
    }
  },
);

//
router.post("/games/matchmaking", ua.authStrict, async (req, res, next) => {
  try {
    //
  } catch (err) {
    next(err);
  }
});

export default router;
