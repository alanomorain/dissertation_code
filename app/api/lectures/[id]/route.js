import { prisma } from "../../../lib/db"
import { NextResponse } from "next/server"
import { getCurrentUser } from "../../../lib/currentUser"

export const runtime = "nodejs"

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params
    const lecturer = await getCurrentUser("LECTURER", { id: true })
    if (!lecturer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const lecture = await prisma.lecture.findFirst({
      where: { id, ownerId: lecturer.id },
      select: { id: true },
    })

    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.analogySet.updateMany({
        where: { lectureId: id, ownerId: lecturer.id },
        data: { lectureId: null },
      }),
      prisma.quiz.updateMany({
        where: { lectureId: id, ownerId: lecturer.id },
        data: { lectureId: null },
      }),
      prisma.lecture.delete({
        where: { id },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error deleting lecture:", error)
    return NextResponse.json({ error: "Unable to delete lecture" }, { status: 500 })
  }
}
