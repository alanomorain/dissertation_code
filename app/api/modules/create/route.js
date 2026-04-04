import { prisma } from "../../../lib/db"
import { getCurrentUser } from "../../../lib/currentUser"
import { enforceRateLimit } from "../../../lib/rateLimit"
import { enforceCsrf } from "../../../lib/security"

export const runtime = "nodejs"

export async function POST(req) {
  try {
    const csrfResponse = enforceCsrf(req)
    if (csrfResponse) {
      return csrfResponse
    }

    const rateLimitResponse = await enforceRateLimit(req, {
      scope: "modules-create",
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
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : ""
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const description = typeof body.description === "string" ? body.description.trim() : ""

    // Validate required fields
    if (!code || !name) {
      return new Response(
        JSON.stringify({ error: "Module code and name are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Validate code format (alphanumeric, uppercase)
    if (!/^[A-Z0-9]{3,10}$/.test(code)) {
      return new Response(
        JSON.stringify({
          error: "Module code must be 3-10 uppercase alphanumeric characters (e.g., CSC7099)",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Check if code already exists
    const existing = await prisma.module.findUnique({
      where: { code },
    })

    if (existing) {
      return new Response(
        JSON.stringify({
          error: `Module code "${code}" already exists`,
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const createdModule = await prisma.module.create({
      data: {
        code,
        name: name.slice(0, 120),
        description: description ? description.slice(0, 1000) : null,
        lecturerId: lecturer.id,
      },
    })

    return new Response(
      JSON.stringify({
        id: createdModule.id,
        code: createdModule.code,
        name: createdModule.name,
        description: createdModule.description,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (err) {
    console.error("Error in /api/modules/create:", err)

    return new Response(
      JSON.stringify({
        error: "Server error while creating module",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
