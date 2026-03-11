import { prisma } from "../../../lib/db"
import { hashPassword } from "../../../lib/passwords"

export const runtime = "nodejs"

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const studentNumber = typeof body.studentNumber === "string" ? body.studentNumber.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const existingByEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    })

    if (existingByEmail) {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    if (studentNumber) {
      const existingByStudentNumber = await prisma.user.findUnique({
        where: { studentNumber },
        select: { id: true },
      })

      if (existingByStudentNumber) {
        return Response.json({ error: "Student number is already in use" }, { status: 409 })
      }
    }

    const passwordHash = await hashPassword(password)
    await prisma.user.create({
      data: {
        email,
        studentNumber: studentNumber || null,
        passwordHash,
        role: "STUDENT",
      },
      select: { id: true },
    })

    return Response.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error("Error in /api/auth/register:", error)
    return Response.json({ error: "Unable to create account" }, { status: 500 })
  }
}
