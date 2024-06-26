import { playerPrisma, userPrisma } from "./prisma/index.js";

let tiers = null;

const init = async () => {
  tiers = await playerPrisma.$queryRaw`
    SELECT tier_name as tierName,
      bonus,
      success_rate as successRate
    FROM Tier
    ORDER BY 1
  `;
};

const tierUtils = {
  /**
   * Applies actual player stats to the inventory's player data based on its level.
   * @param {Object} inventory from Inventory table in game_db, w. player's stats included
   * @returns void
   */
  applyActualPlayerStats: async function (inventory) {
    if (!inventory || !inventory.level) return inventory;
    if (!tiers) await init();
    const select = {};
    if (!("tierName" in inventory)) select.TierName = true;
    if (!("speed" in inventory)) {
      select.speed = true;
      select.goalRate = true;
      select.power = true;
      select.defense = true;
      select.stamina = true;
    }
    if (Object.keys(select).length > 0) {
      const player = await playerPrisma.player.findFirst({
        select,
        where: { playerId: inventory.PlayerId },
      });
      const { TierName, ...playerStats } = player;
      inventory.tierName = player.TierName;
      inventory = { ...inventory, ...playerStats };
    }

    if (inventory.level == 1) return inventory;

    const bonus = tiers[inventory.tierName].bonus[inventory.level];
    if ("speed" in inventory) inventory.speed += bonus;
    if ("goalRate" in inventory) inventory.goalRate += bonus;
    if ("power" in inventory) inventory.power += bonus;
    if ("defense" in inventory) inventory.defense += bonus;
    if ("stamina" in inventory) inventory.stamina += bonus;
    return inventory;
  },

  /**
   * Get upgrade success rate for given 'tier' and 'level' from Tier table
   * @param {Number} tier tier of a player
   * @param {Number} level level of an inventory's player
   * @returns Upgrade success rate at current 'level' of the 'tier', 0 if MAX level, or NULL if any one (or all) of args is invalid.
   */
  getTierUpgradeSuccessRate: async function (tier, level) {
    if (!tier && tier !== 0) return null;
    else if (!level && level !== 0) return null;
    if (typeof tier !== "number" || typeof level !== "number") return null;
    if (!tiers) await init();
    if (tier >= tiers.length) return null;
    if (level > Object.keys(tiers[tier].successRate).length) return 0;
    return tiers[tier].successRate[level];
  },

  /**
   * Get tier bonus for given 'tier' and 'level' from Tier table
   * @param {Number} tier tier of a player
   * @param {Number} level level of an inventory's player
   * @returns Stat bonus at current 'level' of the 'tier', or NULL if any one (or all) of args is invalid.
   */
  getTierStatBonus: async function (tier, level) {
    if (!tier && tier !== 0) return null;
    else if (!level && level !== 0) return null;
    if (typeof tier !== "number" || typeof level !== "number") return null;
    if (!tiers) await init();
    if (tier >= tiers.length) return null;
    if (level > Object.keys(tiers[tier].bonus).length) return null;
    return tiers[tier].bonus[level];
  },
};

export default tierUtils;
