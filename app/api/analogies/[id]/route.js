import { prisma } from "../../../lib/db"
import { NextResponse } from "next/server"
import { getCurrentUser } from "../../../lib/currentUser"

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const lecturer = await getCurrentUser("LECTURER", { id: true })
    if (!lecturer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const analogy = await prisma.analogySet.findFirst({
      where: { id, ownerId: lecturer.id },
      include: {
        module: true,
      },
    })

    if (!analogy) {
      return NextResponse.json(
        { error: "Analogy not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(analogy)
  } catch (err) {
    console.error("Error fetching analogy:", err)
    return NextResponse.json(
      { error: "Server error fetching analogy" },
      { status: 500 }
    )
  }
}
