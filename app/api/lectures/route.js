import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import { enforceRateLimit } from "../../lib/rateLimit"
import { enforceCsrf } from "../../lib/security"

export const runtime = "nodejs"

export async function GET(req) {
  try {
    const lecturer = await getCurrentUser("LECTURER", { id: true })
    if (!lecturer) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const moduleCode = String(searchParams.get("moduleCode") || "").trim().toUpperCase()

    let moduleId
    if (moduleCode) {
      const moduleRecord = await prisma.module.findFirst({
        where: { code: moduleCode, lecturerId: lecturer.id },
        select: { id: true },
      })
      if (!moduleRecord) {
        return Response.json({ error: "Unknown module for this lecturer" }, { status: 400 })
      }
      moduleId = moduleRecord.id
    }

    const lectures = await prisma.lecture.findMany({
      where: {
        ownerId: lecturer.id,
        ...(moduleId ? { moduleId } : {}),
      },
      include: {
        module: { select: { code: true, name: true } },
        _count: { select: { analogySets: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 200,
    })

    return Response.json(lectures)
  } catch (error) {
    console.error("Error fetching lectures:", error)
    return Response.json({ error: "Unable to fetch lectures" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const csrfResponse = enforceCsrf(req)
    if (csrfResponse) {
      return csrfResponse
    }

    const rateLimitResponse = enforceRateLimit(req, {
      scope: "lectures-create",
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
    const title = String(body?.title || "").trim().slice(0, 200)
    const moduleCode = String(body?.moduleCode || "").trim().toUpperCase()
    const sourceType = String(body?.sourceType || "").trim().slice(0, 50) || null
    const sourceFilename = String(body?.sourceFilename || "").trim().slice(0, 255) || null
    const sourceText = String(body?.sourceText || "").slice(0, 15000) || null

    if (!title || !moduleCode) {
      return Response.json({ error: "title and moduleCode are required" }, { status: 400 })
    }

    const moduleRecord = await prisma.module.findFirst({
      where: { code: moduleCode, lecturerId: lecturer.id },
      select: { id: true },
    })
    if (!moduleRecord) {
      return Response.json({ error: "Unknown module for this lecturer" }, { status: 400 })
    }

    const lecture = await prisma.lecture.create({
      data: {
        title,
        moduleId: moduleRecord.id,
        ownerId: lecturer.id,
        sourceType,
        sourceFilename,
        sourceText,
      },
      include: {
        module: { select: { code: true, name: true } },
        _count: { select: { analogySets: true } },
      },
    })

    return Response.json(lecture, { status: 201 })
  } catch (error) {
    console.error("Error creating lecture:", error)
    return Response.json({ error: "Unable to create lecture" }, { status: 500 })
  }
}
