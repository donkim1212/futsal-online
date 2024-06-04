import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userPrisma } from "../lib/utils/prisma/index.js";
import authMiddleware from "../middlewares/auths/user.authenticator.js";
import userValidator from "../middlewares/validators/user-validator.middleware.js";
import errorChecker from "../lib/errors/error-checker.js";

const router = express.Router();
// 회원가입 API
router.post(
  "/users/sign-up",
  userValidator.signUpValidation,
  async (req, res, next) => {
    try {
      const { username, password } = req.body;

      const hashedPassword = await bcrypt.hash(password, process.env.SALT);
      const user = await userPrisma.user.create({
        data: {
          username: username,
          password: hashedPassword,
        },
      });
      return res.status(201).json({
        message: "회원가입 성공.",
        data: { userId: user.userId },
      });
    } catch (err) {
      next(err);
    }
  },
);
// 로그인 API
router.post(
  "/users/sign-in",
  userValidator.signInValidation,
  async (req, res, next) => {
    try {
      const { username, password } = req.body;

      const user = await userPrisma.user.findFirst({ where: { username } });

      if (!user) {
        return res.status(401).json({ message: "존재하지 않는 아이디입니다." });
      }

      if (!bcrypt.compareSync(password, user.password)) {
        return res
          .status(401)
          .json({ message: "비밀번호가 일치하지 않습니다." });
      }

      const token = jwt.sign(
        {
          userId: user.userId,
        },
        process.env.SECRET,
      );

      res.header("authorization", `Bearer ${token}`);
      return res.status(200).json({ message: "로그인 성공" });
    } catch (err) {
      next(err);
    }
  },
);

// 유저 조회 API
router.get(
  "/users/:userId",
  authMiddleware.authOptional,
  userValidator.userIdParamsValidation,
  async (req, res, next) => {
    try {
      const user = await errorChecker.userChecker(req.params.userId, {
        username: true,
        rating: true,
        money: true,
      });
      console.log(req.body.user, req.params.userId);
      if (req.body.user?.userId != req.params.userId) delete user.money;

      // req.header("authorization", `Bearer ${token}`);
      return res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
