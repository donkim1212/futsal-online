import express from "express";
import ua from "../middlewares/auths/user.authenticator.js";

const router = express.Router();

router.post("/stores/gacha", ua.authStrict, async (req, res, next) => {
  try {
    //
  } catch (err) {
    next(err);
  }
});

export default router;
