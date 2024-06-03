import express from "express";
import { playerPrisma } from "../lib/utils/prisma/index.js";

const router = express.Router();

/* 플레이어 생성 API */
router.post("/players", async (req, res, next) => {
  try {
    const { playerName, speed, goalRate, power, defense, stamina, grade } =
      req.body;

    const isExistPlayer = await playerPrisma.player.findFirst({
      where: { playerName: playerName },
    });

    if (isExistPlayer) {
      return res
        .status(409)
        .json({ message: "이미 존재하는 플레이어 이름입니다." });
    }

    const player = await playerPrisma.player.create({
      data: {
        playerName,
        speed,
        goalRate,
        power,
        defense,
        stamina,
        grade,
      },
    });

    return res.status(200).json({ data: player });
  } catch (err) {
    next(err);
  }
});

/* 플레이어 전체 조회 API */
router.get("/players", async (req, res, next) => {
  try {
    const data = await playerPrisma.player.findMany({
      select: {
        playerId: true,
        playerName: true,
      },
    });

    return res.status(200).json({ data: data });
  } catch (err) {
    next(err);
  }
});

/* 플레이어 단일 조회 API */
router.get("/players/:playerId", async (req, res, next) => {
  try {
    const { playerId } = req.params;

    const data = await playerPrisma.player.findFirst({
      where: {
        playerId: +playerId,
      },
      select: {
        playerId: true,
        playerName: true,
        speed: true,
        goalRate: true,
        power: true,
        defense: true,
        stamina: true,
        grade: true,
      },
    });

    return res.status(200).json({ data: data });
  } catch (err) {
    next(err);
  }
});

export default router;
