import { prisma } from "../../../../lib/db"
import { getCurrentUser } from "../../../../lib/currentUser"
import { enforceRateLimit } from "../../../../lib/rateLimit"
import { enforceCsrf } from "../../../../lib/security"

export const runtime = "nodejs"

async function getAccessibleQuiz(id, studentId) {
  return prisma.quiz.findFirst({
    where: {
      id,
      status: "PUBLISHED",
      OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
      module: {
        enrollments: {
          some: {
            userId: studentId,
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
            select: { id: true, isCorrect: true },
          },
        },
      },
    },
  })
}

async function handleStart({ quiz, studentId }) {
  const submittedCount = await prisma.quizAttempt.count({
    where: { quizId: quiz.id, studentId, status: "SUBMITTED" },
  })

  if (submittedCount >= quiz.maxAttempts) {
    return Response.json({ error: "Maximum attempts reached" }, { status: 400 })
  }

  const existing = await prisma.quizAttempt.findFirst({
    where: {
      quizId: quiz.id,
      studentId,
      status: "IN_PROGRESS",
    },
    include: {
      responses: {
        select: {
          questionId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  if (existing) {
    return Response.json({
      attemptId: existing.id,
      answeredQuestionIds: existing.responses.map((response) => response.questionId),
    })
  }

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      studentId,
      status: "IN_PROGRESS",
    },
    select: { id: true },
  })

  return Response.json({ attemptId: attempt.id, answeredQuestionIds: [] })
}

async function handleAnswer({ quiz, body, studentId }) {
  const attemptId = typeof body?.attemptId === "string" ? body.attemptId.trim() : ""
  const questionId = typeof body?.questionId === "string" ? body.questionId.trim() : ""
  const selectedOptionId = typeof body?.selectedOptionId === "string" ? body.selectedOptionId.trim() : ""

  if (!attemptId || !questionId) {
    return Response.json({ error: "attemptId and questionId are required" }, { status: 400 })
  }

  const attempt = await prisma.quizAttempt.findFirst({
    where: {
      id: attemptId,
      quizId: quiz.id,
      studentId,
      status: "IN_PROGRESS",
    },
    select: { id: true },
  })

  if (!attempt) {
    return Response.json({ error: "Attempt not found or already submitted" }, { status: 404 })
  }

  const question = quiz.questions.find((item) => item.id === questionId)
  if (!question) {
    return Response.json({ error: "Question does not belong to this quiz" }, { status: 400 })
  }

  const selected = selectedOptionId
    ? question.options.find((option) => option.id === selectedOptionId)
    : null

  await prisma.quizResponse.upsert({
    where: {
      attemptId_questionId: {
        attemptId,
        questionId,
      },
    },
    update: {
      selectedOptionId: selected ? selected.id : null,
      isCorrect: selected ? !!selected.isCorrect : false,
      textAnswer: null,
      answeredAt: new Date(),
    },
    create: {
      attemptId,
      questionId,
      selectedOptionId: selected ? selected.id : null,
      isCorrect: selected ? !!selected.isCorrect : false,
      textAnswer: null,
      answeredAt: new Date(),
    },
  })

  const currentIndex = quiz.questions.findIndex((item) => item.id === questionId)
  const nextQuestion = currentIndex >= 0 ? quiz.questions[currentIndex + 1] : null

  return Response.json({
    ok: true,
    nextQuestionId: nextQuestion ? nextQuestion.id : null,
    isLastQuestion: !nextQuestion,
  })
}

async function handleInteraction({ quiz, body, studentId }) {
  const attemptId = typeof body?.attemptId === "string" ? body.attemptId.trim() : ""
  const questionId = typeof body?.questionId === "string" ? body.questionId.trim() : ""
  const interactionType = typeof body?.interactionType === "string" ? body.interactionType.trim().toUpperCase() : ""

  if (!attemptId || !questionId || !interactionType) {
    return Response.json({ error: "attemptId, questionId and interactionType are required" }, { status: 400 })
  }

  if (!["ANALOGY_VIEW", "VIDEO_VIEW"].includes(interactionType)) {
    return Response.json({ error: "Invalid interactionType" }, { status: 400 })
  }

  const attempt = await prisma.quizAttempt.findFirst({
    where: {
      id: attemptId,
      quizId: quiz.id,
      studentId,
      status: "IN_PROGRESS",
    },
    select: { id: true },
  })

  if (!attempt) {
    return Response.json({ error: "Attempt not found or already submitted" }, { status: 404 })
  }

  const question = quiz.questions.find((item) => item.id === questionId)
  if (!question) {
    return Response.json({ error: "Question does not belong to this quiz" }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.quizQuestionInteraction.create({
      data: {
        attemptId,
        questionId,
        studentId,
        type: interactionType,
        analogySetId: question.analogySetId || null,
      },
    })

    if (interactionType === "ANALOGY_VIEW" && question.analogySetId) {
      await tx.analogyInteraction.create({
        data: {
          analogySetId: question.analogySetId,
          userId: studentId,
          type: "VIEW",
        },
      })
    }
  })

  return Response.json({ ok: true })
}

async function handleFinish({ quiz, body, studentId }) {
  const attemptId = typeof body?.attemptId === "string" ? body.attemptId.trim() : ""
  if (!attemptId) {
    return Response.json({ error: "attemptId is required" }, { status: 400 })
  }

  const attempt = await prisma.quizAttempt.findFirst({
    where: {
      id: attemptId,
      quizId: quiz.id,
      studentId,
    },
    include: {
      responses: {
        select: {
          questionId: true,
          isCorrect: true,
        },
      },
    },
  })

  if (!attempt) {
    return Response.json({ error: "Attempt not found" }, { status: 404 })
  }

  if (attempt.status === "SUBMITTED") {
    return Response.json({ attemptId: attempt.id, score: attempt.score ?? 0 })
  }

  const existingQuestionIds = new Set(attempt.responses.map((response) => response.questionId))
  const missingQuestions = quiz.questions.filter((question) => !existingQuestionIds.has(question.id))

  if (missingQuestions.length > 0) {
    await prisma.quizResponse.createMany({
      data: missingQuestions.map((question) => ({
        attemptId: attempt.id,
        questionId: question.id,
        selectedOptionId: null,
        isCorrect: false,
        textAnswer: null,
        answeredAt: new Date(),
      })),
    })
  }

  const allResponses = await prisma.quizResponse.findMany({
    where: { attemptId: attempt.id },
    select: { isCorrect: true },
  })

  const total = quiz.questions.length
  const correct = allResponses.filter((response) => response.isCorrect === true).length
  const score = total > 0 ? Math.round((correct / total) * 100) : 0

  const submitted = await prisma.quizAttempt.update({
    where: { id: attempt.id },
    data: {
      status: "SUBMITTED",
      score,
      submittedAt: new Date(),
    },
    select: { id: true, score: true },
  })

  return Response.json({ attemptId: submitted.id, score: submitted.score ?? 0 })
}

export async function POST(req, { params }) {
  try {
    const csrfResponse = enforceCsrf(req)
    if (csrfResponse) {
      return csrfResponse
    }

    const rateLimitResponse = await enforceRateLimit(req, {
      scope: "quiz-attempt-flow",
      limit: 120,
      windowMs: 60 * 1000,
    })
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { id } = await params
    const student = await getCurrentUser("STUDENT", { id: true })
    if (!student) {
      return Response.json({ error: "Student account not found" }, { status: 403 })
    }

    const quiz = await getAccessibleQuiz(id, student.id)
    if (!quiz) {
      return Response.json({ error: "Quiz not available" }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    const action = typeof body?.action === "string" ? body.action.trim().toLowerCase() : ""

    if (action === "start") {
      return handleStart({ quiz, studentId: student.id })
    }

    if (action === "answer") {
      return handleAnswer({ quiz, body, studentId: student.id })
    }

    if (action === "interaction") {
      return handleInteraction({ quiz, body, studentId: student.id })
    }

    if (action === "finish") {
      return handleFinish({ quiz, body, studentId: student.id })
    }

    return Response.json({ error: "Unknown action" }, { status: 400 })
  } catch (err) {
    console.error("Error handling quiz attempt flow", err)
    return Response.json({ error: "Server error in quiz attempt flow" }, { status: 500 })
  }
}
