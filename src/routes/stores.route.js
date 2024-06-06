import express from "express";
import ua from "../middlewares/auths/user.authenticator.js";
import uv from "../middlewares/validators/user-validator.middleware.js";
import ec from "../lib/errors/error-checker.js";
import { playerPrisma, userPrisma } from "../lib/utils/prisma/index.js";
import tierUtils from "../lib/utils/tier-utils.js";
import { Prisma } from "@prisma/client";

const router = express.Router();
const GACHA_STANDARD_PACK_PRICE = 1000;
const GACHA_STANDARD_PACK_RATES = [5, 10, 20, 30, 35];
const UPGRADE_COST = 500;
// const GACHA_MAX = 5; // 0~4, 5 is converted to 4

const gacha = async () => {
  // implement gacha logic, returns player
  const gachaTier = Math.floor(Math.random() * 99 + 1);
  let acc = 0;
  for (let i = 0; i < GACHA_STANDARD_PACK_RATES.length; i++) {
    if ((acc += GACHA_STANDARD_PACK_RATES[i]) >= gachaTier) {
      acc = i;
      break;
    }
  }

  const players = await playerPrisma.player.findMany({
    where: { TierName: acc },
  });

  const gachaPlayer = Math.trunc(Math.random() * players.length);
  if (gachaPlayer == players.length) gachaPlayer--;
  return players[gachaPlayer];
};

router.post("/stores/gacha", ua.authStrict, async (req, res, next) => {
  try {
    const user = await ec.moneyChecker(
      req.body.user.userId,
      GACHA_STANDARD_PACK_PRICE,
    );
    user.money -= GACHA_STANDARD_PACK_PRICE;

    const player = await gacha();

    const inventory = await userPrisma.inventory.findFirst({
      where: { PlayerId: player.playerId, UserId: req.body.user.userId },
    });
    if (!inventory) {
      await userPrisma.inventory.create({
        data: {
          PlayerId: player.playerId,
          count: 1,
          level: 1,
          UserId: req.body.user.userId,
        },
      });
    } else {
      await userPrisma.inventory.update({
        where: {
          UserId: req.body.user.userId,
          PlayerId: player.playerId,
          inventoryId: inventory.inventoryId,
        },
        data: {
          count: inventory.count + 1,
        },
      });
    }

    await userPrisma.user.update({
      where: { userId: req.body.user.userId },
      data: {
        money: user.money,
      },
    });

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

router.post("/stores/upgrade", ua.authStrict, async (req, res, next) => {
  try {
    const { user, inventoryId } = req.body;
    await ec.moneyChecker(user.userId, UPGRADE_COST);
    const inventory = await ec.inventoryUserChecker(user.userId, inventoryId);
    const player = await ec.playerChecker(inventory.PlayerId);
    const successRate = await tierUtils.getTierUpgradeSuccessRate(
      player.TierName,
      inventory.level,
    );

    if (successRate === 0) {
      return res.status(409).json({ message: "강화 레벨이 최대입니다." });
    } else if (!successRate) {
      throw new Error(`/stores/upgrade  |  invalid data`);
    }

    // Upgrade
    const result = Math.random() * 100;
    if (successRate - result >= 0) {
      const where = {
        UserId: user.userId,
        PlayerId: inventory.PlayerId,
        level: inventory.level + 1,
      };

      let upgradedInventory;
      await userPrisma.$transaction(async (prisma) => {
        // check if inv. player w. upgraded lvl already exists
        upgradedInventory = await prisma.inventory.findFirst({
          where: { ...where },
        });

        if (!upgradedInventory) {
          upgradedInventory = await prisma.inventory.create({
            data: {
              count: 1,
              ...where,
            },
          });
        } else {
          upgradedInventory = await prisma.inventory.update({
            where: { inventoryId: upgradedInventory.inventoryId },
            data: {
              count: {
                increment: 1,
              },
            },
          });
        }

        // decrement orignal inventory player count
        await prisma.inventory.update({
          where: {
            inventoryId: inventory.inventoryId,
          },
          data: {
            count: {
              increment: -1,
            },
          },
        });

        upgradedInventory = await tierUtils.applyActualPlayerStats(
          upgradedInventory,
        );

        await prisma.user.update({
          where: { userId: user.userId },
          data: {
            money: {
              increment: -UPGRADE_COST,
            },
          },
        });
      });

      if (!upgradedInventory) throw new Error("Upgrade: transaction failed.");

      return res.status(200).json({
        message: "강화 성공!",
        data: {
          ...upgradedInventory,
        },
      });
    }

    return res.status(200).json({ message: "강화 실패!" });
  } catch (err) {
    next(err);
  }
});

export default router;
