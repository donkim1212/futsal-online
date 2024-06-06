import express from "express";
import { userPrisma } from "../lib/utils/prisma/index.js";
import userAuthMiddleware from "../middlewares/auths/user.authenticator.js";
import errorChecker from "../lib/errors/error-checker.js";

const router = express.Router();

/** Add Team Players Api **/
router.post("/teams", userAuthMiddleware.authStrict, async (req, res, next) => {
  const userId = req.body.user.userId;
  const { inventoryId } = req.body;

  try {
    // Check if the player is in the user's inventory
    const myInventory = await errorChecker.inventoryUserChecker(
      userId,
      inventoryId,
    );
    if (!myInventory) {
      return res
        .status(404)
        .json({ message: "해당 플레이어를 보유하고 있지 않습니다" });
    }

    // Check if the player is already on the team
    const existingPlayer = await userPrisma.team.findFirst({
      where: {
        InventoryId: inventoryId,
      },
    });

    if (existingPlayer) {
      return res
        .status(400)
        .json({ message: "이미 팀에 추가된 플레이어입니다." });
    }

    const existingPlayerCount = await userPrisma.team.count({
      where: {
        UserId: userId,
      },
    });

    if (existingPlayerCount >= 3) {
      return res
        .status(400)
        .json({ message: "팀에 추가할 수 있는 플레이어 수는 최대 3명입니다." });
    }

    //Reduce inventoryId count
    const transaction = await userPrisma.$transaction(async (prisma) => {
      // Add player to team
      await userPrisma.team.create({
        data: {
          UserId: userId,
          InventoryId: inventoryId,
        },
      });
      await prisma.inventory.update({
        where: {
          inventoryId: myInventory.inventoryId,
        },
        data: {
          count: myInventory.count - 1,
        },
      });
      if (existingPlayerCount + 1 == 3) {
        await prisma.matchQueue.create({
          data: { UserId: userId },
        });
      }
    });

    return res.status(200).json({ message: "플레이어가 팀에 추가되었습니다." });
  } catch (error) {
    next(error);
  }
});

/** Remove Team Players Api **/
router.delete(
  "/teams",
  userAuthMiddleware.authStrict,
  async (req, res, next) => {
    const userId = req.body.user.userId;
    const { inventoryId } = req.body;

    try {
      //Check if the player is in the user's team
      const equippedPlayer = await userPrisma.team.findFirst({
        where: {
          UserId: +userId,
          InventoryId: +inventoryId,
        },
      });

      if (!equippedPlayer) {
        return res
          .status(404)
          .json({ message: "해당 플레이어는 팀에 없습니다." });
      }
      await userPrisma.$transaction(async (prisma) => {
        //Remove player from the team
        await prisma.team.delete({
          where: {
            teamId: equippedPlayer.teamId,
          },
        });
        await prisma.inventory.update({
          where: {
            inventoryId: +inventoryId,
          },
          data: {
            count: {
              increment: 1,
            },
          },
        });
        await prisma.matchQueue.deleteMany({
          where: { UserId: userId },
        });
      });

      return res
        .status(200)
        .json({ message: "해당 플레이어가 팀에서 제거되었습니다." });
    } catch (error) {
      return res.status(500).json({
        message: "플레이어를 팀에서 제거하는 중 오류가 발생했습니다.",
        error: error.message,
      });
    }
  },
);

/** Team Players List Api **/
router.get("/teams/:userId", async (req, res, next) => {
  const { userId } = req.params;

  try {
    const teamPlayers = await userPrisma.team.findMany({
      where: {
        UserId: +userId,
      },
      select: {
        teamId: true,
        UserId: true,
        InventoryId: true,
      },
    });

    return res.status(200).json({ data: teamPlayers });
  } catch (error) {
    return next(error);
  }
});

export default router;
