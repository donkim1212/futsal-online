import { playerPrisma, userPrisma } from "../utils/prisma/index.js";
import PlayerNotFoundError from "./classes/player-not-found.error.js";
import UserNotFoundError from "./classes/user-not-found.error.js";
import NotEnoughMoneyError from "./classes/not-enough-money.error.js";

const queryBuilder = (where, select) => {
  const query = {
    where: { ...where },
  };
  if (select && Object.keys(select).length > 0) query.select = select;
  return query;
};

export default errorChecker = {
  userChecker: async function (userId, select) {
    const query = queryBuilder({ userId: userId }, select);
    const user = await userPrisma.user.findUnique(query);
    if (!user) throw new UserNotFoundError();
    return user;
  },
  playerChecker: async function (playerId, select) {
    const query = queryBuilder({ playerId: playerId }, select);
    const player = await playerPrisma.player.findUnique(query);
    if (!player) throw new PlayerNotFoundError();
    return player;
  },
  inventoryChecker: async function (userId, playerId, select) {
    // TODO: change query method, maybe checker function parameters as well
    // -> inventoryId as parameter?
    await userChecker(userId);
    await playerChecker(playerId);
    const query = queryBuilder({ userId: userId, playerId: playerId }, select);
    const inventory = await userPrisma.inventory.findUnique(query);
    if (!inventory)
      throw new PlayerNotFoundError("선수를 보유하고 있지 않습니다.");
    return inventory;
  },
  moneyChecker: async function (userId, requiredMoney, select) {
    if (!select) select = { money: true };
    else if (!select.money) select.money = true;
    const query = queryBuilder({ userId: userId }, select);
    const user = await userPrisma.user.findUnique(query);
    if (requiredMoney > user.money) throw new NotEnoughMoneyError();
    return user;
  },
  pageChecker: async function (pageNumber, loadCount) {
    return [];
  },
};
