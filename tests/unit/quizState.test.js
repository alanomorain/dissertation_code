import { describe, expect, it } from "vitest"
import {
  createStudentAttemptStats,
  getQuizTimingState,
  getStudentQuizProgressState,
} from "../../app/lib/quizState.js"

const now = new Date("2026-05-13T12:00:00.000Z").getTime()

describe("quiz state helpers", () => {
  it("classifies lecturer-facing timing states", () => {
    expect(getQuizTimingState({ status: "DRAFT" }, now)).toBe("DRAFT")
    expect(getQuizTimingState({ status: "ARCHIVED" }, now)).toBe("ARCHIVED")
    expect(getQuizTimingState({ status: "PUBLISHED", publishedAt: "2026-05-14T12:00:00.000Z" }, now)).toBe("SCHEDULED")
    expect(getQuizTimingState({ status: "PUBLISHED", dueAt: "2026-05-12T12:00:00.000Z" }, now)).toBe("PAST")
    expect(getQuizTimingState({ status: "PUBLISHED", publishedAt: "2026-05-12T12:00:00.000Z" }, now)).toBe("ACTIVE")
  })

  it("classifies student progress using release dates, due dates, attempts, and max attempts", () => {
    expect(getStudentQuizProgressState({ publishedAt: "2026-05-14T12:00:00.000Z", maxAttempts: 1 }, {}, now)).toBe("UPCOMING")
    expect(getStudentQuizProgressState({ maxAttempts: 2 }, { submittedCount: 2 }, now)).toBe("COMPLETED")
    expect(getStudentQuizProgressState({ dueAt: "2026-05-12T12:00:00.000Z", maxAttempts: 2 }, { submittedCount: 1 }, now)).toBe("CLOSED")
    expect(getStudentQuizProgressState({ maxAttempts: 2 }, { inProgressCount: 1 }, now)).toBe("IN_PROGRESS")
    expect(getStudentQuizProgressState({ maxAttempts: 2 }, {}, now)).toBe("TO_DO")
  })

  it("summarises attempts per quiz and tracks best submitted score", () => {
    const stats = createStudentAttemptStats([
      { quizId: "quiz-1", status: "SUBMITTED", score: 40 },
      { quizId: "quiz-1", status: "SUBMITTED", score: 80 },
      { quizId: "quiz-1", status: "IN_PROGRESS", score: null },
      { quizId: "quiz-2", status: "IN_PROGRESS", score: null },
    ])

    expect(stats["quiz-1"]).toEqual({
      submittedCount: 2,
      inProgressCount: 1,
      bestScore: 80,
    })
    expect(stats["quiz-2"]).toEqual({
      submittedCount: 0,
      inProgressCount: 1,
      bestScore: null,
    })
  })
})

