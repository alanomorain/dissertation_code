import { prisma } from "../../../lib/db"
import { getCurrentUser } from "../../../lib/currentUser"
import { enforceRateLimit } from "../../../lib/rateLimit"
import { enforceCsrf } from "../../../lib/security"

export const runtime = "nodejs"

function normalizeQuestionsForUpdate(questions, analogySetById) {
  if (!Array.isArray(questions)) return null

  return questions
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
}

export async function GET(_req, { params }) {
  const { id } = await params
  const student = await getCurrentUser("STUDENT", { id: true })
  if (!student) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const quiz = await prisma.quiz.findFirst({
    where: {
      id,
      status: "PUBLISHED",
      AND: [
        { OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
        { OR: [{ dueAt: null }, { dueAt: { gt: now } }] },
      ],
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
          analogySet: {
            select: {
              id: true,
              title: true,
              topicsJson: true,
              reviewStatus: true,
              status: true,
            },
          },
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

export async function PATCH(req, { params }) {
  try {
    const csrfResponse = enforceCsrf(req)
    if (csrfResponse) {
      return csrfResponse
    }

    const rateLimitResponse = await enforceRateLimit(req, {
      scope: "quizzes-update",
      limit: 40,
      windowMs: 60 * 1000,
    })
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { id } = await params
    const lecturer = await getCurrentUser("LECTURER", { id: true })
    if (!lecturer) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const quiz = await prisma.quiz.findFirst({
      where: { id, ownerId: lecturer.id },
      include: {
        _count: { select: { attempts: true } },
      },
    })

    if (!quiz) {
      return Response.json({ error: "Quiz not found" }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    const title = String(body?.title || "").trim()
    const status = ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(body?.status) ? body.status : quiz.status
    const maxAttempts = Math.max(1, Math.min(Number(body?.maxAttempts) || quiz.maxAttempts || 1, 5))
    const parsedDueAt = body?.dueAt ? new Date(body.dueAt) : null
    const parsedPublishedAt = status === "PUBLISHED"
      ? (body?.publishedAt ? new Date(body.publishedAt) : (quiz.publishedAt || new Date()))
      : null
    const shouldReplaceQuestions = Array.isArray(body?.questions)

    if (!title) {
      return Response.json({ error: "title is required" }, { status: 400 })
    }

    if (parsedDueAt && Number.isNaN(parsedDueAt.getTime())) {
      return Response.json({ error: "Invalid dueAt value" }, { status: 400 })
    }

    if (parsedPublishedAt && Number.isNaN(parsedPublishedAt.getTime())) {
      return Response.json({ error: "Invalid publishedAt value" }, { status: 400 })
    }

    if (parsedDueAt && parsedPublishedAt && parsedDueAt <= parsedPublishedAt) {
      return Response.json({ error: "Due date must be after the release date" }, { status: 400 })
    }

    if (shouldReplaceQuestions && quiz._count.attempts > 0) {
      return Response.json(
        { error: "Question editing is locked after students have attempted the quiz" },
        { status: 409 },
      )
    }

    let normalizedQuestions = null
    if (shouldReplaceQuestions) {
      const lectureAnalogySets = await prisma.analogySet.findMany({
        where: {
          ownerId: lecturer.id,
          lectureId: quiz.lectureId,
        },
        select: {
          id: true,
          topicsJson: true,
        },
      })

      const analogySetById = new Map(lectureAnalogySets.map((set) => [set.id, set]))
      normalizedQuestions = normalizeQuestionsForUpdate(body.questions, analogySetById)

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
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.quiz.update({
        where: { id: quiz.id },
        data: {
          title: title.slice(0, 200),
          status,
          maxAttempts,
          dueAt: parsedDueAt,
          publishedAt: parsedPublishedAt,
        },
      })

      if (normalizedQuestions) {
        await tx.quizQuestion.deleteMany({ where: { quizId: quiz.id } })
        for (const question of normalizedQuestions) {
          await tx.quizQuestion.create({
            data: {
              quizId: quiz.id,
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
            },
          })
        }
      }

      return tx.quiz.findUnique({
        where: { id: quiz.id },
        select: { id: true },
      })
    })

    return Response.json(updated)
  } catch (err) {
    console.error("Error updating quiz", err)
    return Response.json({ error: "Server error updating quiz" }, { status: 500 })
  }
}
