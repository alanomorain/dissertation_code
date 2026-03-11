import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"

export async function GET() {
  try {
    const lecturer = await getCurrentUser("LECTURER", { id: true })
    if (!lecturer) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const modules = await prisma.module.findMany({
      where: { lecturerId: lecturer.id },
      orderBy: {
        code: "asc",
      },
    })

    return new Response(JSON.stringify(modules), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error fetching modules:", error)
    return new Response("Error fetching modules", { status: 500 })
  }
}
