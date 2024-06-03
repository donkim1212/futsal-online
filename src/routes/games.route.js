import express from "express";
import ua from "../middlewares/auths/user.authenticator.js";
import ec from "../lib/errors/error-checker.js";

const router = express.Router();

const matchMaking = () => {};

router.post("/games/play/:userId", ua.authStrict, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const opponent = await ec.playerChecker(userId);
    const myTeam = await ec.teamChecker(req.body.user.userId);
    const opTeam = await ec.teamChecker(userId);
  } catch (err) {
    next(err);
  }
});

//
router.post("/games/matchmaking", ua.authStrict, async (req, res, next) => {
  try {
    //
  } catch (err) {
    next(err);
  }
});

export default router;
