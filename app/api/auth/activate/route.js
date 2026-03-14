import { prisma } from "../../../lib/db"
import { hashPassword } from "../../../lib/passwords"
import { enforceRateLimit, getClientIp } from "../../../lib/rateLimit"

export const runtime = "nodejs"

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const token = typeof body.token === "string" ? body.token.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const studentNumber = typeof body.studentNumber === "string" ? body.studentNumber.trim() : ""

    const rateLimitResponse = enforceRateLimit(req, {
      scope: "auth-activate",
      limit: 6,
      windowMs: 10 * 60 * 1000,
      key: `${getClientIp(req)}:${token.slice(0, 12) || "anonymous"}`,
    })
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    if (!token || !password) {
      return Response.json({ error: "Activation token and password are required" }, { status: 400 })
    }
    if (token.length > 200) {
      return Response.json({ error: "Invalid activation token" }, { status: 400 })
    }

    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }
    if (studentNumber.length > 40) {
      return Response.json({ error: "Student number is too long" }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: {
        inviteToken: token,
        role: "STUDENT",
        inviteExpires: { gt: new Date() },
      },
      select: {
        id: true,
        studentNumber: true,
      },
    })

    if (!user) {
      return Response.json({ error: "Invitation is invalid or expired" }, { status: 400 })
    }

    if (studentNumber && studentNumber !== user.studentNumber) {
      const existing = await prisma.user.findUnique({
        where: { studentNumber },
        select: { id: true },
      })
      if (existing && existing.id !== user.id) {
        return Response.json({ error: "Student number is already in use" }, { status: 409 })
      }
    }

    const passwordHash = await hashPassword(password)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          studentNumber: studentNumber || user.studentNumber || null,
          inviteToken: null,
          inviteExpires: null,
        },
      }),
      prisma.moduleEnrollment.updateMany({
        where: { userId: user.id, status: "INVITED" },
        data: { status: "ACTIVE" },
      }),
    ])

    return Response.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("Error in /api/auth/activate:", error)
    return Response.json({ error: "Unable to activate account" }, { status: 500 })
  }
}
