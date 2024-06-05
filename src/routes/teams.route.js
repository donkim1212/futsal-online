import express from "express";
import { userPrisma } from "../lib/utils/prisma/index.js";
import userAuthMiddleware from "../middlewares/auths/user.authenticator.js";
import errorChecker from "../lib/errors/error-checker.js";

const router = express.Router();

/** Add Team Players Api **/
router.post(
  "/teams",
  userAuthMiddleware.authStrict,
  async (req, res, next) => {
    const userId = req.body.user.userId;
    const { inventoryId } = req.body;

    try {
      // Check if the player is in the user's inventory
      const myInventory = await errorChecker.inventoryUserChecker( userId,inventoryId);
      if (!myInventory){
        return res.status(404).json({message:"해당 플레이어가 존재하지 않습니다"});
      }

      // Check if the player is already on the team
      const existingPlayer = await userPrisma.team.findFirst({
        where: {
          InventoryId: +inventoryId,
        },
      });

      if (existingPlayer) {
        return res
          .status(400)
          .json({ message: "이미 팀에 추가된 플레이어입니다." });
      }

    // Add player to team
    const addPlayer = await userPrisma.team.create({
      data: {
        User: { connect: { userId: +userId } }, // Connect to an existing user
        Inventory: { connect: { inventoryId: +inventoryId } }, // Connect to an existing inventory
      },
      include: {
        Inventory: true, 
      },
    });

    return res.status(200).json({ message: "플레이어가 팀에 추가되었습니다." });
  } catch (error) {
    next(error)  }
}
);

/** Remove Team Players Api **/
router.delete(
  "/teams",
  userAuthMiddleware.authStrict,
  async (req, res, next) => {
    const userId = req.body.user.userId;
    const { inventoryId } = req.body;

    try {
      //Check if user exists
      await errorChecker.userChecker({ userId });

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

      //Remove player from the team
      await user.team.delete({
        where: {
          teamId: equippedPlayer.teamId,
        },
      });
      //Add player back to the inventory
      await user.inventory.create({
        data: {
          UserId: +userId,
          InventoryId: +inventoryId,
          count: 1,
        },
      });

      return res
        .status(200)
        .json({ message: "해당 플레이어가 팀에서 제거되었습니다." });
    } catch (error) {
      next(error);
    }
  },
);

/** Team Players List Api **/
router.get(
  "/teams",
  userAuthMiddleware.authOptional,
  async (req, res, next) => {
    const userId = req.body.user?.userId || null;

    const teamPlayers = await userPrisma.team.findMany({
      where: {
        UserId: +userId,
      },
    
      orderBy: {
        teamId: "asc",
      },
    });
    return res.status(200).json({ data: teamPlayers });
  },
);

export default router;
