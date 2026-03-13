import { prisma } from "../../../lib/db"
import { getCurrentUser } from "../../../lib/currentUser"

export const runtime = "nodejs"

export async function GET(_req, { params }) {
  const { id } = await params
  const student = await getCurrentUser("STUDENT", { id: true })
  if (!student) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const quiz = await prisma.quiz.findFirst({
    where: {
      id,
      status: "PUBLISHED",
      OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
      module: {
        enrollments: {
          some: {
            userId: student.id,
            status: "ACTIVE",
          },
        },
      },
    },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
        include: {
          options: {
            orderBy: { orderIndex: "asc" },
            select: { id: true, text: true },
          },
        },
      },
    },
  })

  if (!quiz) {
    return Response.json({ error: "Quiz not found" }, { status: 404 })
  }

  return Response.json(quiz)
}
