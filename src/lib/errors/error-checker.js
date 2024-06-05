import { playerPrisma, userPrisma } from "../utils/prisma/index.js";
import PlayerNotFoundError from "./classes/player-not-found.error.js";
import UserNotFoundError from "./classes/user-not-found.error.js";
import NotEnoughMoneyError from "./classes/not-enough-money.error.js";
import TeamNotReadyError from "./classes/team-not-ready.error.js";

const queryBuilder = (where, select) => {
  const query = {
    where: { ...where },
  };
  if (select && Object.keys(select).length > 0) query.select = select;
  return query;
};

const errorChecker = {
  /**
   *
   * @param {Number} userId target user's userId
   * @param {Object} select object literal containing fields to select, e.g., { id: true, password: false }
   * @returns selected field values of user data w. matching userId
   * @throws UserNotFoundError if no such user exists.
   */
  userChecker: async function (userId, select) {
    const query = queryBuilder({ userId: userId }, select);
    const user = await userPrisma.user.findUnique(query);
    if (!user) throw new UserNotFoundError();
    return user;
  },

  /**
   *
   * @param {Number} playerId target player's playerId
   * @param {Object} select object literal containing fields to select, e.g., { id: true, password: false }
   * @returns player's data
   * @throws PlayerNotFoundError if no such player exists.
   */
  playerChecker: async function (playerId, select) {
    const query = queryBuilder({ playerId: playerId }, select);
    const player = await playerPrisma.player.findUnique(query);
    if (!player) throw new PlayerNotFoundError();
    return player;
  },

  /**
   *
   * @param {*} userId target user's userId
   * @param {*} playerId target player's playerId
   * @param {*} select object literal containing fields to select, e.g., { id: true, password: false }
   * @returns a row of an inventory
   * @throws PlayerNotFoundError if no such inventory data exists.
   */
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

  /**
   *
   * @param {*} userId target user's userId
   * @param {*} requiredMoney money required for the job
   * @param {*} select object literal containing fields to select, e.g., { id: true, password: false }
   * @returns the user w. money field selected
   * @throws NotEnoughMoneyError if user has not enough money
   */
  moneyChecker: async function (userId, requiredMoney, select) {
    if (!select) select = { money: true };
    else if (!select.money) select.money = true;
    const query = queryBuilder({ userId: userId }, select);
    const user = await userPrisma.user.findUnique(query);
    if (requiredMoney > user.money) throw new NotEnoughMoneyError();
    delete user.password;
    return user;
  },

  teamChecker: async function (userId, select) {
    const query = queryBuilder({ UserId: userId }, select);
    query.include = {
      Inventory: true,
    };
    const team = await userPrisma.team.findMany(query);
    if (team.length != 3) throw new TeamNotReadyError();
    return team;
  },
};

export default errorChecker;
