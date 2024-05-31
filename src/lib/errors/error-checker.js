import { prisma } from "";
import PlayerNotFoundError from "./classes/player-not-found.error.js";
import UserNotFoundError from "./classes/user-not-found.error.js";

const queryBuilder = (where, select) => {
  const query = {
    where: { ...where },
  };
  if (select && Object.keys(select).length > 0) query.select = select;
  return query;
};

export default errorChecker = {
  loginChecker: async function (username, password) {
    return {};
  },
  userChecker: async function (userId) {
    const where = {
      userId: userId,
    };
    const select = {
      userId: true,
      username: true,
      rating: true,
    };
    const user = await prisma.user.findUnique(queryBuilder(where, select));
    if (!user) throw new UserNotFoundError();
    return user;
  },
  playerChecker: async function (playerId) {
    const where = {
      playerId: playerId,
    };
    const select = {};
    const player = await prisma.player.findUnique(queryBuilder(where, select));
    if (!player) throw new PlayerNotFoundError();
    return player;
  },
  inventoryChecker: async function (userId, playerId) {
    return {};
  },
  moneyChecker: async function (userId, chargeMoney) {
    return {};
  },
  pageChecker: async function (pageNumber, loadCount) {
    return [];
  },
};
