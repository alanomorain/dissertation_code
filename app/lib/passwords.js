import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scrypt = promisify(scryptCallback)

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex")
  const derivedKey = await scrypt(password, salt, 64)
  return `${salt}:${Buffer.from(derivedKey).toString("hex")}`
}

export async function verifyPassword(password, passwordHash) {
  if (!passwordHash || typeof passwordHash !== "string" || !passwordHash.includes(":")) {
    return false
  }

  const [salt, storedHash] = passwordHash.split(":")
  const derivedKey = await scrypt(password, salt, 64)
  const storedBuffer = Buffer.from(storedHash, "hex")
  const derivedBuffer = Buffer.from(derivedKey)

  if (storedBuffer.length !== derivedBuffer.length) {
    return false
  }

  return timingSafeEqual(storedBuffer, derivedBuffer)
}
