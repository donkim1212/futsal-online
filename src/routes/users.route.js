import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { check, validationResult } from "express-validator";
import { userPrisma } from "../lib/utils/prisma/index.js";
import authMiddleware from "../middlewares/auths/user.authenticator.js";


const userPrisma = new PrismaClient();
const router = express.Router();
// 회원가입 API
router.post(
  '/sign-up',
  [
    check("account").matches(/^[a-z0-9]+$/).withMessage("아이디는 영어 소문자와 숫자의 조합이어야 합니다."),
    check("password").isLength({ min: 6 }).withMessage("비밀번호는 최소 6자리 이상이어야 합니다."),
    check("confirmPassword").custom((value, { req }) => value === req.body.password).withMessage("비밀번호와 비밀번호 확인이 일치하지 않습니다."),
    check("name").not().isEmpty().withMessage("이름을 입력해주세요.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { account, password, name } = req.body;

      const isExistUser = await userPrisma.account.findFirst({ where: { account } });
      if (isExistUser) {
        return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await userPrisma.account.create({
        data: {
          account,
          password: hashedPassword,
          name,
          money: 10000, // 기본 충전 금액 설정
        },
      });

      return res.status(201).json({
        userId: user.id,
        account: user.account,
        name: user.name,
        money: user.money,
      });
    } catch (error) {
      console.error("회원가입 중 에러 발생:", error);
      return res.status(500).json({ message: "회원가입 중 에러가 발생했습니다." });
    }
  }
);
// 로그인 API
router.post("/sign-in", async (req, res) => {
  try {
    const { account, password } = req.body;

    const user = await userPrisma.account.findFirst({ where: { account } });

    if (!user) {
      return res.status(401).json({ message: "존재하지 않는 아이디입니다." });
    } else if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      "jwt-secret"
    );

    res.header("authorization", `Bearer ${token}`);
    return res.status(200).json({ message: "로그인 성공" });
  } catch (error) {
    console.error("로그인 중 에러 발생:", error);
    return res.status(500).json({ message: "로그인 중 에러가 발생했습니다." });
  }
});

// 유저 조회 API
router.get("/userid", authMiddleware, async (req, res) => {
  try {
    const user = await userPrisma.account.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        account: true,
        name: true,
        money: true,
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
    }
   
    req.header("authorization", `Bearer ${token}`);
    return res.status(200).json(user);
  } catch (error) {
    console.error("유저 조회 중 에러 발생:", error);
    return res.status(500).json({ message: "유저 조회 중 에러가 발생했습니다." });
  }
});

export default router;
