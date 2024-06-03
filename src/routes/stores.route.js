import express from "express";
import ua from "../middlewares/auths/user.authenticator.js";
import uv from "../middlewares/validators/user-validator.middleware.js";
import ec from "../lib/errors/error-checker.js";
import { userPrisma } from "../lib/utils/prisma/index.js";

const router = express.Router();
const GACHA_STANDARD_PACK_PRICE = 1000;
const GACHA_STANDARD_PACK_RATES = [0.35, 0.3, 0.2, 0.1, 0.05]; // D C B A S

const gacha = async () => {
  // implement gacha logic, returns player
};

router.post("/stores/gacha", ua.authStrict, async (req, res, next) => {
  try {
    //
    const user = await ec.moneyChecker(
      req.body.user.userId,
      GACHA_STANDARD_PACK_PRICE,
    );
    user.money -= GACHA_STANDARD_PACK_PRICE;

    const player = await gacha();

    return res.status(200).json({
      money: user.money,
      data: {
        playerId: player.playerId,
        playerName: player.playerName,
        speed: player.speed,
        goalRate: player.goalRate,
        power: player.power,
        defense: player.defense,
        stamina: player.stamina,
        tierName: player.tierName,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/stores/cash/buy",
  ua.authStrict,
  uv.cashPurchaseValidation,
  async (req, res, next) => {
    try {
      //
      const { amount } = req.body;
      await userPrisma.user.update({
        where: { userId: req.body.user.userId },
        data: {
          money: {
            increment: amount,
          },
        },
      });

      return res.status(200).json({ message: `${amount}원 충전 완료.` });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
