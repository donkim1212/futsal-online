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
    if (!inventory || !inventory.level) return;
    if (!tiers) await init();
    if (inventory.level == 1) return;
    if (!("tierName" in inventory)) {
      inventory.tierName = (
        await playerPrisma.player.findFirst({
          select: { TierName: true },
          where: { playerId: inventory.PlayerId },
        })
      ).TierName;
    }
    const bonus = tiers[inventory.tierName].bonus[inventory.level];
    if ("speed" in inventory) inventory.speed += bonus;
    if ("goalRate" in inventory) inventory.goalRate += bonus;
    if ("power" in inventory) inventory.power += bonus;
    if ("defense" in inventory) inventory.defense += bonus;
    if ("stamina" in inventory) inventory.stamina += bonus;
  },

  /**
   * Get upgrade success rate for given 'tier' and 'level' from Tier table
   * @param {Number} tier tier of a player
   * @param {Number} level level of an inventory's player
   * @returns Upgrade success rate at current 'level' of the 'tier'
   */
  getTierUpgradeSuccessRate: async function (tier, level) {
    if (!tier && tier !== 0) return;
    else if (!level && level !== 0) return;
    if (typeof tier !== "number" || typeof level !== "number") return;
    if (!tiers) await init();
    if (tier >= tiers.length) return;
    if (level >= Object.keys(tiers[tier].successRate).length) return;
    return tiers[tier].successRate[level];
  },

  /**
   * Get tier bonus for given 'tier' and 'level' from Tier table
   * @param {Number} tier tier of a player
   * @param {Number} level level of an inventory's player
   * @returns stat bonus at current 'level' of the 'tier'
   */
  getTierStatBonus: async function (tier, level) {
    if (!tier && tier !== 0) return;
    else if (!level && level !== 0) return;
    if (typeof tier !== "number" || typeof level !== "number") return;
    if (!tiers) await init();
    if (tier >= tiers.length) return;
    if (level >= Object.keys(tiers[tier].bonus).length) return;
    return tiers[tier].bonus[level];
  },
};

export default tierUtils;
