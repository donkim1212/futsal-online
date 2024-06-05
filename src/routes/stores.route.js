import express from "express";
import ua from "../middlewares/auths/user.authenticator.js";
import uv from "../middlewares/validators/user-validator.middleware.js";
import ec from "../lib/errors/error-checker.js";
import { playerPrisma, userPrisma } from "../lib/utils/prisma/index.js";

const router = express.Router();
const GACHA_STANDARD_PACK_PRICE = 1000;
const GACHA_STANDARD_PACK_RATES = [5, 10, 20, 30, 35]; //
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

    const isPlayer = await userPrisma.inventory.findFirst({
      where: { PlayerId: player.playerId, UserId: req.body.user.userId },
    });
    if (!isPlayer) {
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
          inventoryId: isPlayer.inventoryId,
        },
        data: {
          count: isPlayer.count + 1,
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
    await ec.userChecker(user.userId);
    const inventory = await ec.inventoryUserChecker(user.userId, inventoryId);
    if (inventory.count <= 0)
      return res
        .status(409)
        .json({ message: "선수를 보유하고 있지 않습니다." });

    const tier = await playerPrisma.tier.findFirst({
      where: { tierName: inventory.TierName },
    });

    const successRate = tier.successRate[`${inventory.level}`];
    if (!successRate) {
      return res.status(409).json({ message: "강화 레벨이 최대입니다." });
    }
    // Upgrade
    const result = Math.random() * 100;
    if (successRate - result >= 0) {
      // for (let key in tier.bonus) {
      //   if (parseInt(key) < inventory.level + 1) bonus += tier.bonus[key];
      // }
      const where = {
        UserId: user.userId,
        PlayerId: inventory.PlayerId,
        level: inventory.level + 1,
      };

      let upgradedInventory = await userPrisma.inventory.findFirst({
        where: { ...where },
      });

      if (!upgradedInventory) {
        upgradedInventory = await userPrisma.inventory.create({
          data: {
            count: 1,
            ...where,
          },
        });
      } else {
        upgradedInventory = await userPrisma.inventory.update({
          where: { inventoryId: upgradedInventory.inventoryId },
          data: {
            count: {
              increment: 1,
            },
          },
        });
      }

      await userPrisma.inventory.update({
        where: {
          inventoryId: inventory.inventoryId,
        },
        data: {
          count: {
            increment: -1,
          },
        },
      });

      const bonus = tier.bonus[`${inventory.level}`];
      const player = await playerPrisma.player.findUnique({
        where: { playerId: inventory.PlayerId },
      });

      delete player.TierName;
      player.speed += bonus;
      player.goalRate += bonus;
      player.power += bonus;
      player.defense += bonus;
      player.stamina += bonus;

      return res.status(200).json({
        message: "강화 성공!",
        data: {
          inventoryId: upgradedInventory.inventoryId,
          ...player,
          level: upgradedInventory.level,
        },
      });
    }
    return res.status(200).json({ message: "강화 실패!" });
  } catch (err) {
    next(err);
  }
});

export default router;
