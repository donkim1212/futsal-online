import express from "express";
import { userPrisma } from "../lib/utils/prisma/index.js";
import userValidatorJoi from "../middlewares/validators/user-validator.middleware.js";

const router = express.Router();

const userRanking = async (userId) => {
  return await userPrisma.$queryRaw`
    SELECT *
    FROM (
      SELECT CONVERT(RANK()OVER(ORDER BY rating DESC), CHAR) as ranking,
        user_id as userId,
        username,
        rating,
        CONCAT(wins,'/',draws,'/',loses) as 'W/D/L'
      FROM User
    ) a
    WHERE userId=${userId}
  `;
};

const allRankings = async (pageNumber, loadCount) => {
  const start = (pageNumber - 1) * loadCount;
  return await userPrisma.$queryRaw`
    SELECT *
    FROM (
      SELECT CONVERT(RANK()OVER(ORDER BY rating DESC), CHAR) as ranking,
        user_id as userId,
        username,
        rating,
        CONCAT(wins,'/',draws,'/',loses) as 'W/D/L'
      FROM User
    ) a
    WHERE ranking > ${start}
    LIMIT ${loadCount}
  `;
};

router.get(
  "/rankings",
  userValidatorJoi.userIdQueryValidationOptional,
  userValidatorJoi.pagenationValidation,
  async (req, res, next) => {
    try {
      const { userId } = req.query;
      console.log(userId);
      const { pageNumber, loadCount } = req.body;
      const rank = userId
        ? await userRanking(userId)
        : await allRankings(pageNumber, loadCount);

      if (userId && !rank)
        return res.status(404).json({ message: "존재하지 않는 유저입니다." });

      return res.status(200).json({ data: userId ? rank[0] : rank });
    } catch (error) {
      next(error);
    }
  },
);

// router.patch("/rankup/:userId", async (req, res, next) => {
//   const { userId } = req.params;

//   const user = await userPrisma.user.update({
//     where: {
//       userId: +userId,
//     },
//     data: {
//       rating: {
//         increment: 50,
//       },
//     },
//   });

//   return res.status(200).json({ data: user });
// });

export default router;
