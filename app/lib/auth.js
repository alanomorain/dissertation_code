import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import { prisma } from "./db"

const SESSION_COOKIE = "lta_session"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured")
  }
  return secret
}

function encodeSession(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const signature = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url")
  return `${encodedPayload}.${signature}`
}

function decodeSession(value) {
  if (!value || typeof value !== "string") return null
  const [encodedPayload, signature] = value.split(".")
  if (!encodedPayload || !signature) return null

  const expectedSignature = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url")

  const provided = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"))
    const issuedAt = Number(parsed?.issuedAt)
    if (!Number.isFinite(issuedAt)) {
      return null
    }

    if (Date.now() - issuedAt > SESSION_TTL_MS) {
      return null
    }

    if (!parsed?.userId || typeof parsed.userId !== "string") {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function buildSessionCookie(user) {
  return {
    name: SESSION_COOKIE,
    value: encodeSession({
      userId: user.id,
      role: user.role,
      issuedAt: Date.now(),
    }),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  }
}

export function buildExpiredSessionCookie() {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const rawSession = cookieStore.get(SESSION_COOKIE)?.value
  return decodeSession(rawSession)
}

export async function getCurrentUser(role, select) {
  const session = await getSession()
  if (!session?.userId) return null

  const selectWithRole = select
    ? {
        ...select,
        role: true,
      }
    : undefined

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: selectWithRole,
  })

  if (!user) {
    return null
  }

  if (role) {
    const requiredRole = String(role).toUpperCase()
    if (user.role !== requiredRole) {
      return null
    }
  }

  return user
}
