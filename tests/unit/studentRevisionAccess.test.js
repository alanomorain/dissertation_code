import { describe, expect, it } from "vitest"
import {
  isLectureRevisionUnlocked,
  isQuizRevisionUnlocked,
} from "../../app/lib/studentRevisionAccess.js"

const now = new Date("2026-05-13T12:00:00.000Z").getTime()

describe("student revision access helpers", () => {
  it("unlocks a quiz after a perfect score", () => {
    expect(isQuizRevisionUnlocked({
      maxAttempts: 3,
      attempts: [{ status: "SUBMITTED", score: 100 }],
    }, now)).toBe(true)
  })

  it("unlocks a quiz when max attempts have been submitted", () => {
    expect(isQuizRevisionUnlocked({
      maxAttempts: 2,
      attempts: [
        { status: "SUBMITTED", score: 20 },
        { status: "SUBMITTED", score: 40 },
      ],
    }, now)).toBe(true)
  })

  it("unlocks a quiz after the due date", () => {
    expect(isQuizRevisionUnlocked({
      maxAttempts: 2,
      dueAt: "2026-05-12T12:00:00.000Z",
      attempts: [],
    }, now)).toBe(true)
  })

  it("keeps revision locked while attempts remain and due date is future", () => {
    expect(isQuizRevisionUnlocked({
      maxAttempts: 2,
      dueAt: "2026-05-14T12:00:00.000Z",
      attempts: [{ status: "SUBMITTED", score: 50 }],
    }, now)).toBe(false)
  })

  it("unlocks a lecture when any attached quiz is unlocked", () => {
    expect(isLectureRevisionUnlocked({
      quizzes: [
        { maxAttempts: 1, attempts: [] },
        { maxAttempts: 1, attempts: [{ status: "SUBMITTED", score: 100 }] },
      ],
    }, now)).toBe(true)
  })
})

