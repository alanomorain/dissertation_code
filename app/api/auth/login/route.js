import { prisma } from "../../../lib/db"
import { buildSessionCookie } from "../../../lib/auth"
import { verifyPassword } from "../../../lib/passwords"
import { enforceRateLimit, getClientIp } from "../../../lib/rateLimit"

export const runtime = "nodejs"
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const role = typeof body.role === "string" ? body.role.trim().toUpperCase() : ""

    const rateLimitResponse = enforceRateLimit(req, {
      scope: "auth-login",
      limit: 10,
      windowMs: 60 * 1000,
      key: `${getClientIp(req)}:${email || "anonymous"}`,
    })
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    if (!email || !password || !role) {
      return Response.json({ error: "email, password, and role are required" }, { status: 400 })
    }
    if (!EMAIL_REGEX.test(email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 })
    }

    if (!["LECTURER", "STUDENT", "ADMIN"].includes(role)) {
      return Response.json({ error: "Invalid role" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        passwordHash: true,
      },
    })

    if (!user || user.role !== role || !user.passwordHash) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const headers = new Headers({ "Content-Type": "application/json" })
    const sessionCookie = buildSessionCookie(user)
    const cookieParts = [
      `${sessionCookie.name}=${sessionCookie.value}`,
      `Max-Age=${sessionCookie.maxAge}`,
      `Path=${sessionCookie.path}`,
      "HttpOnly",
      "SameSite=Lax",
    ]

    if (sessionCookie.secure) {
      cookieParts.push("Secure")
    }

    headers.append("Set-Cookie", cookieParts.join("; "))
    return new Response(JSON.stringify({ ok: true, role: user.role }), { status: 200, headers })
  } catch (error) {
    console.error("Error in /api/auth/login:", error)
    return Response.json({ error: "Unable to sign in" }, { status: 500 })
  }
}
