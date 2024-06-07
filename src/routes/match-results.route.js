import express from "express";
import { userPrisma } from "../lib/utils/prisma/index.js";

const router = express.Router();

router.get("/match-results/", async (req, res, next) => {
  try {
    //
    const { userId, loadCount } = req.query;
    const history = await userPrisma.$queryRaw`
      SELECT *
      FROM MatchHistory
      WHERE myId=${parseInt(userId)}
        OR opId=${parseInt(userId)}
      ORDER BY created_at DESC
      LIMIT ${parseInt(loadCount)}
    `;

    return res.status(200).json(history);
  } catch (err) {
    next(err);
  }
});

export default router;
