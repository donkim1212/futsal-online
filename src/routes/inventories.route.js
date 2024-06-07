import express from "express";
import { userPrisma, playerPrisma } from "../lib/utils/prisma/index.js";
import userAuthMiddleware from "../middlewares/auths/user.authenticator.js";
import userValidation from "../middlewares/validators/user-validator.middleware.js";
import errorChecker from "../lib/errors/error-checker.js";
import tierUtils from "../lib/utils/tier-utils.js";

const router = express.Router();

// 보유선수 전체조회
router.get(
  "/inventories",
  userAuthMiddleware.authStrict,
  async (req, res, next) => {
    try {
      await errorChecker.userChecker(req.body.user.userId);
      const inventories = await userPrisma.$queryRaw`
        SELECT inv.inventory_id as inventoryId,
          inv.count,
          inv.level,
          inv.user_id as userId,
          inv.player_id as playerId,
          pl.player_name as playerName
        FROM game_db.Inventory inv
        JOIN player_db.Player pl
        ON inv.player_id=pl.player_id
        WHERE inv.user_id=${req.body.user.userId}
          AND count > 0
      `;

      return res.status(200).json(inventories);
    } catch (err) {
      next(err);
    }
  },
);

// 상세 보유선수 조회
router.get(
  "/inventories/:inventoryId",
  userAuthMiddleware.authStrict,
  userValidation.inventoryIdParamValidation,
  async (req, res, next) => {
    try {
      const { inventoryId } = req.params;
      const inventory = await userPrisma.$queryRaw`
        SELECT inv.inventory_id as inventoryId,
          inv.count,
          inv.level,
          inv.user_id as userId,
          inv.player_id as playerId,
          pl.player_name as playerName,
          pl.speed,
          pl.goal_rate as goalRate,
          pl.power,
          pl.defense,
          pl.stamina,
          pl.tier_name as tierName
        FROM game_db.Inventory inv
        JOIN player_db.Player pl
        ON inv.player_id=pl.player_id
        WHERE inv.inventory_id=${inventoryId}
          AND inv.user_id=${req.body.user.userId}
          AND count > 0
      `;

      if (inventory.length < 1)
        return res
          .status(404)
          .json({ message: "선수를 보유 중이지 않습니다." });

      if (inventory[0].level > 1) {
        await tierUtils.applyActualPlayerStats(inventory[0]);
      }

      return res.status(200).json(inventory[0]);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
