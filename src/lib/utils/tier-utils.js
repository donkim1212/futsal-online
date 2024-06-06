import { playerPrisma } from "./prisma/index.js";

let tiers = null;

const init = async () => {
  tiers = await playerPrisma.$queryRaw`
    SELECT * FROM Tier
  `;
};

const tierUtils = {
  /**
   * Applies actual player stats to the inventory's player data based on its level.
   * @param {Object} inventory from table Inventory in game_db
   * @returns void
   */
  applyActualPlayerStats: async function (inventory) {
    if (!inventory || !inventory.level) return;
    if (!tiers) await init();
    if (inventory.level == 1) return;
    const bonus = tiers[inventory.level].bonus;
    if (inventory.speed) inventory.speed += bonus;
    if (inventory.goalRate) inventory.goalRate += bonus;
    if (inventory.power) inventory.power += bonus;
    if (inventory.defense) inventory.defense += bonus;
    if (inventory.stamina) inventory.stamina += bonus;
  },
};

export default tierUtils;
