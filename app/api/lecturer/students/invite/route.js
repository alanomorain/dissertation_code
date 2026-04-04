import { randomBytes } from "node:crypto"
import { prisma } from "../../../../lib/db"
import { getCurrentUser } from "../../../../lib/currentUser"
import { enforceRateLimit } from "../../../../lib/rateLimit"
import { enforceCsrf } from "../../../../lib/security"

export const runtime = "nodejs"

const INVITE_TTL_HOURS = 72
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req) {
  try {
    const csrfResponse = enforceCsrf(req)
    if (csrfResponse) {
      return csrfResponse
    }

    const rateLimitResponse = await enforceRateLimit(req, {
      scope: "lecturer-students-invite",
      limit: 20,
      windowMs: 60 * 1000,
    })
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const lecturer = await getCurrentUser("LECTURER", { id: true })
    if (!lecturer) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const studentNumber = typeof body.studentNumber === "string" ? body.studentNumber.trim() : ""
    const moduleCode = typeof body.moduleCode === "string" ? body.moduleCode.trim() : ""

    if (!email || !moduleCode) {
      return Response.json({ error: "Email and module are required" }, { status: 400 })
    }
    if (!EMAIL_REGEX.test(email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 })
    }
    if (studentNumber.length > 40) {
      return Response.json({ error: "Student number is too long" }, { status: 400 })
    }

    const moduleRecord = await prisma.module.findFirst({
      where: { code: moduleCode, lecturerId: lecturer.id },
      select: { id: true, code: true },
    })

    if (!moduleRecord) {
      return Response.json({ error: "Module not found for this lecturer" }, { status: 404 })
    }

    if (studentNumber) {
      const numberOwner = await prisma.user.findUnique({
        where: { studentNumber },
        select: { id: true, email: true, role: true },
      })
      if (numberOwner && numberOwner.email !== email) {
        return Response.json({ error: "Student number belongs to a different account" }, { status: 409 })
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, studentNumber: true },
    })

    if (existingUser && existingUser.role !== "STUDENT") {
      return Response.json({ error: "Email belongs to a non-student account" }, { status: 409 })
    }

    const inviteToken = randomBytes(24).toString("base64url")
    const inviteExpires = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000)

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            inviteToken,
            inviteExpires,
            studentNumber: studentNumber || existingUser.studentNumber || null,
          },
          select: { id: true, email: true },
        })
      : await prisma.user.create({
          data: {
            email,
            role: "STUDENT",
            studentNumber: studentNumber || null,
            inviteToken,
            inviteExpires,
          },
          select: { id: true, email: true },
        })

    await prisma.moduleEnrollment.upsert({
      where: {
        userId_moduleId: {
          userId: user.id,
          moduleId: moduleRecord.id,
        },
      },
      update: {
        status: "INVITED",
      },
      create: {
        userId: user.id,
        moduleId: moduleRecord.id,
        status: "INVITED",
      },
    })

    const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const activationLink = `${baseUrl}/student/activate?token=${encodeURIComponent(inviteToken)}`

    return Response.json(
      {
        ok: true,
        email: user.email,
        moduleCode: moduleRecord.code,
        activationLink,
        expiresAt: inviteExpires.toISOString(),
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in /api/lecturer/students/invite:", error)
    return Response.json({ error: "Unable to create invitation" }, { status: 500 })
  }
}
