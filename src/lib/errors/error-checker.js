export default errorChecker = {
  loginChecker: async function (username, password) {
    return {};
  },
  userChecker: async function (userId) {
    return {};
  },
  playerChecker: async function (playerId) {
    return {};
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
