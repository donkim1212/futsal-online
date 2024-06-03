import express from "express";
import { playerPrisma } from "../lib/utils/prisma/index.js";

const router = express.Router();

router.post("/tier", async (req, res, next) => {
  //
  const { tierName, bonus, successRate } = req.body;
  await playerPrisma.tier.create({
    data: {
      tierName: tierName,
      bonus: bonus,
      successRate: successRate,
    },
  });

  return res.status(200).json({ message: "h" });
});

router.patch("/tier/:tierName", async (req, res, next) => {
  const { bonus, successRate } = req.body;
  await playerPrisma.tier.update({
    where: { tierName: tierName },
    data: {
      bonus: bonus,
      successRate: successRate,
    },
  });

  return res.status(200).json({ message: "h" });
});

export default router;
