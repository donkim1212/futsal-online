import express from "express";
import ua from "../middlewares/auths/user.authenticator.js";
import { userPrisma } from "../lib/utils/prisma/index.js";

const router = express.Router();

router.post("/stores/gacha", ua.authStrict, async (req, res, next) => {
  try {
    //
  } catch (err) {
    next(err);
  }
});

router.patch("/stores/cash/buy", ua.authStrict, async (req, res, next) => {
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
});

export default router;
