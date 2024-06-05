import express from "express";
import { userPrisma } from "../lib/utils/prisma/index.js";

const router = express.Router();

router.get("/rankings", async (req, res, next) => {
  try {
    const rank = await userPrisma.$queryRaw`
    SELECT CONVERT(RANK()OVER(ORDER BY rating DESC), CHAR) 
    "랭킹", user_id, username, rating
    FROM User;`;

    return res.status(200).json({ data: rank });
  } catch (error) {
    next(error);
  }
});

router.patch("/rankup/:userId", async (req, res, next) => {
  const { userId } = req.params;

  const user = await userPrisma.user.update({
    where: {
      userId: +userId,
    },
    data: {
      rating: {
        increment: 50,
      },
    },
  });

  return res.status(200).json({ data: user });
});

export default router;
