import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import { enforceRateLimit } from "../../lib/rateLimit"
import { enforceCsrf } from "../../lib/security"

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
    const csrfResponse = enforceCsrf(req)
    if (csrfResponse) {
      return csrfResponse
    }

    const rateLimitResponse = await enforceRateLimit(req, {
      scope: "quizzes-create",
      limit: 20,
      windowMs: 60 * 1000,
    })
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const lecturer = await getCurrentUser("LECTURER", { id: true })
    if (!lecturer) {
      return Response.json({ error: "Lecturer account not found" }, { status: 403 })
    }

    const body = await req.json()
    const { title, moduleCode, lectureId, status, dueAt, publishedAt, maxAttempts, questions } = body

    if (!title || !moduleCode || !lectureId) {
      return Response.json({ error: "title, moduleCode, and lectureId are required" }, { status: 400 })
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

    const lectureRecord = await prisma.lecture.findFirst({
      where: {
        id: lectureId,
        ownerId: lecturer.id,
        moduleId: moduleRecord.id,
      },
      select: { id: true },
    })
    if (!lectureRecord) {
      return Response.json({ error: "Unknown lecture for this lecturer/module" }, { status: 400 })
    }

    const lectureAnalogySets = await prisma.analogySet.findMany({
      where: {
        ownerId: lecturer.id,
        lectureId: lectureRecord.id,
      },
      select: {
        id: true,
        topicsJson: true,
      },
    })

    const analogySetById = new Map(lectureAnalogySets.map((set) => [set.id, set]))

    const normalizedQuestions = questions
      .slice(0, 50)
      .map((question, questionIndex) => {
        const normalizedOptions = (Array.isArray(question?.options) ? question.options : [])
          .slice(0, 6)
          .map((option, optionIndex) => ({
            text: String(option?.text || "").trim().slice(0, 300),
            isCorrect: !!option?.isCorrect,
            orderIndex: optionIndex,
          }))
          .filter((option) => option.text.length > 0)

        const analogySetId = typeof question?.analogySetId === "string" ? question.analogySetId.trim() : ""
        const parsedTopicIndex = Number(question?.analogyTopicIndex)
        const analogyTopicIndex = Number.isInteger(parsedTopicIndex) && parsedTopicIndex >= 0
          ? parsedTopicIndex
          : null
        const videoUrl = typeof question?.videoUrl === "string"
          ? question.videoUrl.trim().slice(0, 2000)
          : ""

        const mappedSet = analogySetId ? analogySetById.get(analogySetId) : null
        const topics = Array.isArray(mappedSet?.topicsJson?.topics) ? mappedSet.topicsJson.topics : []
        const hasValidTopicIndex = analogyTopicIndex !== null && analogyTopicIndex < topics.length

        return {
          prompt: String(question?.prompt || "").trim().slice(0, 1000),
          type: "MCQ",
          difficulty: ["EASY", "MEDIUM", "HARD"].includes(question?.difficulty)
            ? question.difficulty
            : "MEDIUM",
          orderIndex: questionIndex,
          options: normalizedOptions,
          analogySetId: mappedSet?.id || null,
          analogyTopicIndex: hasValidTopicIndex ? analogyTopicIndex : null,
          videoUrl: videoUrl || null,
        }
      })
      .filter((question) => question.prompt.length > 0)

    if (normalizedQuestions.length === 0) {
      return Response.json({ error: "Questions must include non-empty prompts" }, { status: 400 })
    }

    const hasInvalidMcq = normalizedQuestions.some(
      (question) => question.options.length < 2 || !question.options.some((option) => option.isCorrect),
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
        lectureId: lectureRecord.id,
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
            analogySetId: question.analogySetId,
            analogyTopicIndex: question.analogyTopicIndex,
            videoUrl: question.videoUrl,
            options: {
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
