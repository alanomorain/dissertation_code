import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const { Pool } = pg

const globalForPrisma = globalThis

const pool =
  globalForPrisma.__pgPool ??
  new Pool({ connectionString: process.env.DATABASE_URL })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__pgPool = pool
}

const adapter =
  globalForPrisma.__prismaAdapter ??
  new PrismaPg(pool)

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prismaAdapter = adapter
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter, log: ["error", "warn"] })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
