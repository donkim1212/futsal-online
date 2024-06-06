import express from "express";
import { userPrisma } from "../lib/utils/prisma/index.js";

const router = express.Router();

router.get("/rankings", async (req, res, next) => {
  try {
    const { pageNumber, loadCount } = req.body;
    const start = (pageNumber - 1) * loadCount;
    const rank = await userPrisma.$queryRaw`
      SELECT *
      FROM (
        SELECT CONVERT(RANK()OVER(ORDER BY rating DESC), CHAR) as ranking,
          user_id as userId,
          username,
          rating
        FROM User
      ) a
      WHERE ranking > ${start}
      LIMIT ${loadCount}
    `;

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
