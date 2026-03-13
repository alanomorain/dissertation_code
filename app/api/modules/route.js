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

    return Response.json(modules, { status: 200 })
  } catch (error) {
    console.error("Error fetching modules:", error)
    return Response.json({ error: "Unable to fetch modules" }, { status: 500 })
  }
}
