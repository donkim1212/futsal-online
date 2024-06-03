import express from "express";
import ua from "../middlewares/auths/user.authenticator.js";
import ec from "../lib/errors/error-checker.js";

const router = express.Router();

const matchMaking = () => {};

router.post("/games/play", ua.authStrict, async (req, res, next) => {
  try {
    //
  } catch (err) {
    next(err);
  }
});

export default router;
