// src/utils/prisma/index.js

import { PrismaClient as UserPrismaClient } from "../../../prisma/user/index.js";
import { PrismaClient as playerPrismaPrismaClient } from "../../../prisma/player/index.js";

export const playerPrisma = new playerPrismaPrismaClient({
  log: ["query", "info", "warn", "error"],

  errorFormat: "pretty",
});

export const userPrisma = new UserPrismaClient({
  log: ["query", "info", "warn", "error"],

  errorFormat: "pretty",
});
