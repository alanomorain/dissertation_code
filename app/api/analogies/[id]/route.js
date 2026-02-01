import { prisma } from "../../../lib/db"
import { NextResponse } from "next/server"

export async function GET(request, { params }) {
  try {
    const { id } = await params

    const analogy = await prisma.analogySet.findUnique({
      where: { id },
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
