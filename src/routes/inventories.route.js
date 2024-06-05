import express from "express";
import { userPrisma, playerPrisma } from "../lib/utils/prisma/index.js";
import userAuthMiddleware from "../middlewares/auths/user.authenticator.js";
import userValidation from "../middlewares/validators/user-validator.middleware.js";
import errorChecker from "../lib/errors/error-checker.js";

const router = express.Router();

// 보유선수 전체조회
router.get(
  "/inventories",
  userAuthMiddleware.authStrict,
  async (req, res, next) => {
    try {
      await errorChecker.userChecker(req.body.user.userId);
      const invendata = await userPrisma.inventory.findMany({
        select: {
          inventoryId: true,
          PlayerId: true,
          PlayerName: true,
          level: true,
          count: true,
        },
        where: {
          UserId: req.body.user.userId,
          count: {
            not: 0,
          },
        },
      });

      return res.status(200).json(invendata);
    } catch (err) {
      next(err);
    }

    if (!invendata) {
      return res
        .status(401)
        .json({ errmessage: "인벤토리에 존재하지 않습니다" });
    }
  },
);

// 상세 보유선수 조회
router.get(
  "/inventories/:inventoryId",
  userAuthMiddleware.authStrict,
  userValidation.inventoryIdParamValidation,
  async (req, res, next) => {
    const { inventoryId } = req.params;
    try {
      const inventory = await userPrisma.inventory.findFirst({
        where: {
          inventoryId: inventoryId,
        },
      });
      // const { PlayerId } = inventory
      const player = await playerPrisma.player.findUnique({
        where: {
          playerId: inventory.PlayerId,
        },
      });

      return res
        .status(200)
        .json({ inventoryId: inventory.inventoryId, ...player });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
