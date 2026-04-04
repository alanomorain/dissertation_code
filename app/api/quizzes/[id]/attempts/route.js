import { prisma } from "../../../../lib/db"
import { getCurrentUser } from "../../../../lib/currentUser"
import { enforceRateLimit } from "../../../../lib/rateLimit"
import { enforceCsrf } from "../../../../lib/security"

export const runtime = "nodejs"

export async function POST(req, { params }) {
  try {
    const csrfResponse = enforceCsrf(req)
    if (csrfResponse) {
      return csrfResponse
    }

    const rateLimitResponse = await enforceRateLimit(req, {
      scope: "quiz-attempt-submit",
      limit: 30,
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
          include: { options: true },
        },
      },
    })

    if (!quiz) {
      return Response.json({ error: "Quiz not available" }, { status: 404 })
    }

    const submittedCount = await prisma.quizAttempt.count({
      where: { quizId: quiz.id, studentId: student.id, status: "SUBMITTED" },
    })

    if (submittedCount >= quiz.maxAttempts) {
      return Response.json({ error: "Maximum attempts reached" }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const responses = Array.isArray(body.responses) ? body.responses : []

    const responseMap = new Map(
      responses
        .filter((item) => item && typeof item.questionId === "string")
        .map((item) => [item.questionId, item]),
    )

    let gradedCount = 0
    let correctCount = 0
    const responseRows = []

    for (const question of quiz.questions) {
      const incoming = responseMap.get(question.id)
      if (!incoming) continue

      if (question.type === "MCQ") {
        const selectedOptionId = typeof incoming.selectedOptionId === "string" ? incoming.selectedOptionId : null
        const selected = question.options.find((option) => option.id === selectedOptionId)
        if (selected) {
          gradedCount += 1
          if (selected.isCorrect) correctCount += 1
        }

        responseRows.push({
          questionId: question.id,
          selectedOptionId: selected ? selected.id : null,
          isCorrect: selected ? !!selected.isCorrect : false,
        })
      } else {
        const textAnswer = typeof incoming.textAnswer === "string" ? incoming.textAnswer.trim().slice(0, 5000) : ""
        responseRows.push({
          questionId: question.id,
          textAnswer,
          isCorrect: null,
        })
      }
    }

    const score = gradedCount > 0 ? Math.round((correctCount / gradedCount) * 100) : 0

    const createdAttempt = await prisma.$transaction(async (tx) => {
      const attempt = await tx.quizAttempt.create({
        data: {
          quizId: quiz.id,
          studentId: student.id,
          status: "IN_PROGRESS",
        },
      })

      if (responseRows.length > 0) {
        await tx.quizResponse.createMany({
          data: responseRows.map((row) => ({
            ...row,
            attemptId: attempt.id,
          })),
        })
      }

      return tx.quizAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "SUBMITTED",
          score,
          submittedAt: new Date(),
        },
      })
    })

    return Response.json({ attemptId: createdAttempt.id, score })
  } catch (err) {
    console.error("Error submitting quiz attempt", err)
    return Response.json({ error: "Server error submitting attempt" }, { status: 500 })
  }
}
