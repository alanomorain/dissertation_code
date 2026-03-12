export function getQuizTimingState(quiz, nowTs = new Date().getTime()) {
  const publishedTs = quiz.publishedAt ? new Date(quiz.publishedAt).getTime() : null
  const dueTs = quiz.dueAt ? new Date(quiz.dueAt).getTime() : null

  if (quiz.status === "DRAFT") return "DRAFT"
  if (quiz.status === "ARCHIVED") return "ARCHIVED"
  if (quiz.status === "PUBLISHED" && publishedTs && publishedTs > nowTs) return "SCHEDULED"
  if (quiz.status === "PUBLISHED" && dueTs && dueTs < nowTs) return "PAST"
  return "ACTIVE"
}

export function getStudentQuizProgressState(quiz, attemptStats, nowTs = new Date().getTime()) {
  const releaseTs = quiz.publishedAt ? new Date(quiz.publishedAt).getTime() : null
  const dueTs = quiz.dueAt ? new Date(quiz.dueAt).getTime() : null
  const submittedCount = attemptStats?.submittedCount || 0
  const inProgressCount = attemptStats?.inProgressCount || 0

  if (releaseTs && releaseTs > nowTs) return "UPCOMING"
  if (submittedCount >= quiz.maxAttempts) return "COMPLETED"
  if (dueTs && dueTs < nowTs) return "COMPLETED"
  if (inProgressCount > 0 || submittedCount > 0) return "IN_PROGRESS"
  return "TO_DO"
}

export function createStudentAttemptStats(attempts) {
  return attempts.reduce((acc, attempt) => {
    if (!acc[attempt.quizId]) {
      acc[attempt.quizId] = {
        submittedCount: 0,
        inProgressCount: 0,
        bestScore: null,
      }
    }

    if (attempt.status === "SUBMITTED") {
      acc[attempt.quizId].submittedCount += 1
      if (typeof attempt.score === "number") {
        acc[attempt.quizId].bestScore = Math.max(acc[attempt.quizId].bestScore ?? 0, attempt.score)
      }
    } else if (attempt.status === "IN_PROGRESS") {
      acc[attempt.quizId].inProgressCount += 1
    }

    return acc
  }, {})
}
