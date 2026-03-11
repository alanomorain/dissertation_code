import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"

export const runtime = "nodejs"

export async function GET() {
  const lecturer = await getCurrentUser("LECTURER", { id: true })
  if (!lecturer) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const quizzes = await prisma.quiz.findMany({
    where: { ownerId: lecturer.id },
    include: {
      module: { select: { code: true, name: true } },
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return Response.json({ quizzes })
}

export async function POST(req) {
  try {
    const lecturer = await getCurrentUser("LECTURER", { id: true })
    if (!lecturer) {
      return Response.json({ error: "Lecturer account not found" }, { status: 403 })
    }

    const body = await req.json()
    const { title, moduleCode, status, dueAt, maxAttempts, questions } = body

    if (!title || !moduleCode) {
      return Response.json({ error: "title and moduleCode are required" }, { status: 400 })
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return Response.json({ error: "At least one question is required" }, { status: 400 })
    }

    const moduleRecord = await prisma.module.findFirst({
      where: { code: moduleCode, lecturerId: lecturer.id },
    })
    if (!moduleRecord) {
      return Response.json({ error: "Unknown module for this lecturer" }, { status: 400 })
    }

    const created = await prisma.quiz.create({
      data: {
        title: title.trim().slice(0, 200),
        moduleId: moduleRecord.id,
        ownerId: lecturer.id,
        status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        visibility: "ENROLLED",
        maxAttempts: Math.max(1, Math.min(Number(maxAttempts) || 1, 5)),
        dueAt: dueAt ? new Date(dueAt) : null,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        questions: {
          create: questions.slice(0, 50).map((question, questionIndex) => ({
            prompt: String(question.prompt || "").trim().slice(0, 1000),
            type: question.type === "SHORT" ? "SHORT" : "MCQ",
            difficulty: ["EASY", "MEDIUM", "HARD"].includes(question.difficulty)
              ? question.difficulty
              : "MEDIUM",
            orderIndex: questionIndex,
            options:
              question.type === "SHORT"
                ? undefined
                : {
                    create: (Array.isArray(question.options) ? question.options : [])
                      .slice(0, 6)
                      .map((option, optionIndex) => ({
                        text: String(option.text || "").trim().slice(0, 300),
                        isCorrect: !!option.isCorrect,
                        orderIndex: optionIndex,
                      })),
                  },
          })),
        },
      },
      select: { id: true },
    })

    return Response.json(created, { status: 201 })
  } catch (err) {
    console.error("Error creating quiz", err)
    return Response.json({ error: "Server error creating quiz" }, { status: 500 })
  }
}
