import { prisma } from "../../../lib/db"
import { getCurrentUser } from "../../../lib/currentUser"
import { enforceRateLimit } from "../../../lib/rateLimit"
import { enforceCsrf } from "../../../lib/security"

export const runtime = "nodejs"

const VALID_STATUS = new Set(["ACTIVE", "INVITED", "DROPPED"])
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET(req) {
  try {
    const lecturer = await getCurrentUser("LECTURER", { id: true })
    if (!lecturer) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const moduleCodeFilter = (searchParams.get("module") || "").trim()

    const modules = await prisma.module.findMany({
      where: { lecturerId: lecturer.id },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    })

    if (moduleCodeFilter && !modules.some((module) => module.code === moduleCodeFilter)) {
      return Response.json({ error: "Module not found for this lecturer" }, { status: 404 })
    }

    const enrollments = await prisma.moduleEnrollment.findMany({
      where: {
        module: {
          lecturerId: lecturer.id,
          ...(moduleCodeFilter ? { code: moduleCodeFilter } : {}),
        },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        module: { select: { id: true, code: true, name: true } },
        user: { select: { id: true, email: true, studentNumber: true } },
      },
      orderBy: [{ module: { code: "asc" } }, { createdAt: "desc" }],
    })

    return Response.json({ modules, enrollments })
  } catch (error) {
    console.error("Error in GET /api/lecturer/students:", error)
    return Response.json({ error: "Unable to load students" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const csrfResponse = enforceCsrf(req)
    if (csrfResponse) {
      return csrfResponse
    }

    const rateLimitResponse = enforceRateLimit(req, {
      scope: "lecturer-students-post",
      limit: 30,
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
    const moduleCode = typeof body.moduleCode === "string" ? body.moduleCode.trim().toUpperCase() : ""
    const requestedStatus = typeof body.status === "string" ? body.status.toUpperCase() : "ACTIVE"
    const status = VALID_STATUS.has(requestedStatus) ? requestedStatus : "ACTIVE"

    if (!email || !moduleCode) {
      return Response.json({ error: "Email and module are required" }, { status: 400 })
    }
    if (!EMAIL_REGEX.test(email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 })
    }

    const moduleRecord = await prisma.module.findFirst({
      where: { code: moduleCode, lecturerId: lecturer.id },
      select: { id: true, code: true },
    })
    if (!moduleRecord) {
      return Response.json({ error: "Module not found for this lecturer" }, { status: 404 })
    }

    const student = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    })
    if (!student || student.role !== "STUDENT") {
      return Response.json({ error: "Student account not found. Use invite flow for new students." }, { status: 404 })
    }

    const enrollment = await prisma.moduleEnrollment.upsert({
      where: {
        userId_moduleId: {
          userId: student.id,
          moduleId: moduleRecord.id,
        },
      },
      update: { status },
      create: {
        userId: student.id,
        moduleId: moduleRecord.id,
        status,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        module: { select: { code: true, name: true } },
        user: { select: { email: true, studentNumber: true } },
      },
    })

    return Response.json({ ok: true, enrollment }, { status: 200 })
  } catch (error) {
    console.error("Error in POST /api/lecturer/students:", error)
    return Response.json({ error: "Unable to update enrollment" }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const csrfResponse = enforceCsrf(req)
    if (csrfResponse) {
      return csrfResponse
    }

    const rateLimitResponse = enforceRateLimit(req, {
      scope: "lecturer-students-patch",
      limit: 50,
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
    const enrollmentId = typeof body.enrollmentId === "string" ? body.enrollmentId.trim() : ""
    const requestedStatus = typeof body.status === "string" ? body.status.toUpperCase() : ""

    if (!enrollmentId || !VALID_STATUS.has(requestedStatus)) {
      return Response.json({ error: "Valid enrollmentId and status are required" }, { status: 400 })
    }

    const enrollment = await prisma.moduleEnrollment.findFirst({
      where: {
        id: enrollmentId,
        module: { lecturerId: lecturer.id },
      },
      select: { id: true },
    })
    if (!enrollment) {
      return Response.json({ error: "Enrollment not found" }, { status: 404 })
    }

    const updated = await prisma.moduleEnrollment.update({
      where: { id: enrollmentId },
      data: { status: requestedStatus },
      select: { id: true, status: true },
    })

    return Response.json({ ok: true, enrollment: updated }, { status: 200 })
  } catch (error) {
    console.error("Error in PATCH /api/lecturer/students:", error)
    return Response.json({ error: "Unable to update access" }, { status: 500 })
  }
}
