import { prisma } from "../../../lib/db"
import { getCurrentUser } from "../../../lib/currentUser"

export const runtime = "nodejs"

export async function POST(req) {
  try {
    const lecturer = await getCurrentUser("LECTURER", { id: true })
    if (!lecturer) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { code, name, description } = body

    console.log("📝 Module creation request:", { code, name, description })

    // Validate required fields
    if (!code || !name) {
      console.log("❌ Missing required fields")
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
      console.log("❌ Invalid code format:", code)
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
    console.log("🔍 Checking for existing module with code:", code)
    const existing = await prisma.module.findUnique({
      where: { code },
    })

    if (existing) {
      console.log("⚠️ Module code already exists:", code)
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
    console.log("✅ Creating module...")
    const createdModule = await prisma.module.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        description: description?.trim() || null,
        lecturerId: lecturer.id,
      },
    })

    console.log("✅ Module created:", createdModule.id)

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
    console.error("❌ Error in /api/modules/create:", err)

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
