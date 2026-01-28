import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const { Pool } = pg

let prismaInstance 

const initPrisma = () => {
  if (prismaInstance) {
    return prismaInstance
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  
  prismaInstance = new PrismaClient({ adapter, log: ["error", "warn"] })
  
  return prismaInstance
}

export const prisma = initPrisma()
