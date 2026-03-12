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
    const { title, moduleCode, status, dueAt, publishedAt, maxAttempts, questions } = body

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

    const normalizedQuestions = questions
      .slice(0, 50)
      .map((question, questionIndex) => {
        const type = question?.type === "SHORT" ? "SHORT" : "MCQ"
        const normalizedOptions = type === "SHORT"
          ? []
          : (Array.isArray(question?.options) ? question.options : [])
              .slice(0, 6)
              .map((option, optionIndex) => ({
                text: String(option?.text || "").trim().slice(0, 300),
                isCorrect: !!option?.isCorrect,
                orderIndex: optionIndex,
              }))
              .filter((option) => option.text.length > 0)

        return {
          prompt: String(question?.prompt || "").trim().slice(0, 1000),
          type,
          difficulty: ["EASY", "MEDIUM", "HARD"].includes(question?.difficulty)
            ? question.difficulty
            : "MEDIUM",
          orderIndex: questionIndex,
          options: normalizedOptions,
        }
      })
      .filter((question) => question.prompt.length > 0)

    if (normalizedQuestions.length === 0) {
      return Response.json({ error: "Questions must include non-empty prompts" }, { status: 400 })
    }

    const hasInvalidMcq = normalizedQuestions.some(
      (question) =>
        question.type === "MCQ"
        && (question.options.length < 2 || !question.options.some((option) => option.isCorrect)),
    )

    if (hasInvalidMcq) {
      return Response.json(
        { error: "Each MCQ requires at least two options and one correct option" },
        { status: 400 },
      )
    }

    const isPublished = status === "PUBLISHED"
    const parsedDueAt = dueAt ? new Date(dueAt) : null
    const parsedPublishedAt = isPublished
      ? (publishedAt ? new Date(publishedAt) : new Date())
      : null

    if (parsedDueAt && Number.isNaN(parsedDueAt.getTime())) {
      return Response.json({ error: "Invalid dueAt value" }, { status: 400 })
    }

    if (parsedPublishedAt && Number.isNaN(parsedPublishedAt.getTime())) {
      return Response.json({ error: "Invalid publishedAt value" }, { status: 400 })
    }

    const created = await prisma.quiz.create({
      data: {
        title: title.trim().slice(0, 200),
        moduleId: moduleRecord.id,
        ownerId: lecturer.id,
        status: isPublished ? "PUBLISHED" : "DRAFT",
        visibility: "ENROLLED",
        maxAttempts: Math.max(1, Math.min(Number(maxAttempts) || 1, 5)),
        dueAt: parsedDueAt,
        publishedAt: parsedPublishedAt,
        questions: {
          create: normalizedQuestions.map((question) => ({
            prompt: question.prompt,
            type: question.type,
            difficulty: question.difficulty,
            orderIndex: question.orderIndex,
            options:
              question.type === "SHORT"
                ? undefined
                : {
                    create: question.options,
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
