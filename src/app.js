import express from "express";
import dotenv from "dotenv/config";
import dotenvExpand from "dotenv-expand";
import logger from "./middlewares/logger.middleware.js";
import errorHandler from "./middlewares/error-handler.middleware.js";
import tiersRouter from "./routes/tiers.route.js";
import playersRouter from "./routes/players.route.js";
import teamsRouter from "./routes/teams.route.js";
import storesRouter from "./routes/stores.route.js";
import gamesRouter from "./routes/games.route.js";
import usersRouter from "./routes/users.route.js";
import rankRouter from "./routes/rankings.route.js";
import inventoriesRouter from "./routes/inventories.route.js";
import matchResultsRouter from "./routes/match-results.route.js";

const app = express();
const PORT = process.env.PORT || 8081;
dotenvExpand.expand(dotenv);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.use("/api", [
  playersRouter,
  teamsRouter,
  tiersRouter,
  gamesRouter,
  inventoriesRouter,
  storesRouter,
  usersRouter,
  rankRouter,
  matchResultsRouter,
]);

app.use(errorHandler);

app.use("/", async (req, res, next) => {
  res.send("Hello, world!");
});

app.listen(PORT, () => {
  console.log("Server running on port: ", PORT);
});
