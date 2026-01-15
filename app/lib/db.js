import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis

const adapter =
  globalForPrisma.__prismaAdapter ??
  new PrismaPg({ connectionString: process.env.DATABASE_URL })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prismaAdapter = adapter
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter, log: ["error", "warn"] })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
