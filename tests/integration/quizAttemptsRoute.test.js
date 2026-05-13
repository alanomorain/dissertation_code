import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  prisma: {
    quiz: {
      findFirst: vi.fn(),
    },
    quizAttempt: {
      findFirst: vi.fn(),
    },
    quizResponse: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  getCurrentUser: vi.fn(),
  enforceRateLimit: vi.fn(),
}))

vi.mock("../../app/lib/db.js", () => ({ prisma: mocks.prisma }))
vi.mock("../../app/lib/currentUser.js", () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock("../../app/lib/rateLimit.js", () => ({ enforceRateLimit: mocks.enforceRateLimit }))

const { POST } = await import("../../app/api/quizzes/[id]/attempts/route.js")

const quiz = {
  id: "quiz-1",
  maxAttempts: 2,
  questions: [
    {
      id: "question-1",
      analogySetId: "analogy-1",
      options: [
        { id: "option-1", isCorrect: true },
        { id: "option-2", isCorrect: false },
      ],
    },
    {
      id: "question-2",
      analogySetId: null,
      options: [
        { id: "option-3", isCorrect: true },
        { id: "option-4", isCorrect: false },
      ],
    },
  ],
}

function jsonRequest(body) {
  return new Request("http://localhost:3000/api/quizzes/quiz-1/attempts", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify(body),
  })
}

function params() {
  return { params: Promise.resolve({ id: "quiz-1" }) }
}

describe("/api/quizzes/[id]/attempts", () => {
  beforeEach(() => {
    mocks.getCurrentUser.mockResolvedValue({ id: "student-1" })
    mocks.enforceRateLimit.mockResolvedValue(null)
    mocks.prisma.quiz.findFirst.mockResolvedValue(quiz)
    mocks.prisma.quizAttempt.findFirst.mockResolvedValue({ id: "attempt-1" })
    mocks.prisma.quizResponse.upsert.mockResolvedValue({})
    mocks.prisma.$transaction.mockImplementation(async (callback) => callback({
      quizAttempt: {
        count: vi.fn().mockResolvedValue(0),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "attempt-1" }),
        update: vi.fn().mockResolvedValue({ id: "attempt-1", score: 50 }),
      },
      quizResponse: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
        findMany: vi.fn().mockResolvedValue([{ isCorrect: true }, { isCorrect: false }]),
      },
      quizQuestionInteraction: {
        create: vi.fn().mockResolvedValue({}),
      },
      analogyInteraction: {
        create: vi.fn().mockResolvedValue({}),
      },
    }))
  })

  it("rejects non-student users", async () => {
    mocks.getCurrentUser.mockResolvedValue(null)

    const response = await POST(jsonRequest({ action: "start" }), params())

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: "Student account not found" })
  })

  it("starts a new attempt when the quiz is accessible", async () => {
    const response = await POST(jsonRequest({ action: "start" }), params())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      attemptId: "attempt-1",
      answeredQuestionIds: [],
    })
  })

  it("records an answer and reports the next question", async () => {
    const response = await POST(jsonRequest({
      action: "answer",
      attemptId: "attempt-1",
      questionId: "question-1",
      selectedOptionId: "option-1",
    }), params())

    expect(response.status).toBe(200)
    expect(mocks.prisma.quizResponse.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        selectedOptionId: "option-1",
        isCorrect: true,
      }),
    }))
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      nextQuestionId: "question-2",
      isLastQuestion: false,
    })
  })

  it("rejects interactions with invalid interaction types", async () => {
    const response = await POST(jsonRequest({
      action: "interaction",
      attemptId: "attempt-1",
      questionId: "question-1",
      interactionType: "download",
    }), params())

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Invalid interactionType" })
  })

  it("finishes an attempt and calculates the score from stored responses", async () => {
    mocks.prisma.$transaction.mockImplementationOnce(async (callback) => callback({
      quizAttempt: {
        findFirst: vi.fn().mockResolvedValue({
          id: "attempt-1",
          status: "IN_PROGRESS",
          responses: [{ questionId: "question-1", isCorrect: true }],
        }),
        count: vi.fn().mockResolvedValue(0),
        update: vi.fn().mockResolvedValue({ id: "attempt-1", score: 50 }),
      },
      quizResponse: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
        findMany: vi.fn().mockResolvedValue([{ isCorrect: true }, { isCorrect: false }]),
      },
    }))

    const response = await POST(jsonRequest({
      action: "finish",
      attemptId: "attempt-1",
    }), params())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      attemptId: "attempt-1",
      score: 50,
    })
  })

  it("rejects unknown actions", async () => {
    const response = await POST(jsonRequest({ action: "something-else" }), params())

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Unknown action" })
  })
})
