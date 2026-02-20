import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const { Pool } = pg

const DEFAULT_DATABASE_URL = "postgresql://postgres:password@localhost:5432/dissertation_db?schema=public"

let prismaInstance

const initPrisma = () => {
  if (prismaInstance) {
    return prismaInstance
  }

  const connectionString = process.env.DATABASE_URL || DEFAULT_DATABASE_URL
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  prismaInstance = new PrismaClient({ adapter, log: ["error", "warn"] })

  return prismaInstance
}

export const prisma = initPrisma()
