import { prisma } from "../../../lib/db"

export const runtime = "nodejs"

export async function POST(req) {
  try {
    const body = await req.json()
    const { code, name, description } = body

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

    // Create the module
    const module = await prisma.module.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        description: description?.trim() || null,
      },
    })

    return new Response(
      JSON.stringify({
        id: module.id,
        code: module.code,
        name: module.name,
        description: module.description,
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
        details: err.message || String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
