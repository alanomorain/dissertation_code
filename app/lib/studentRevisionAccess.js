export function isQuizRevisionUnlocked(quiz, nowTs = new Date().getTime()) {
  const submittedAttempts = Array.isArray(quiz?.attempts)
    ? quiz.attempts.filter((attempt) => attempt.status === "SUBMITTED")
    : []
  const submittedCount = Array.isArray(quiz?.attempts)
    ? submittedAttempts.length
    : Number(quiz?.submittedAttempts || 0)
  const hasPerfectScore = submittedAttempts.some((attempt) => Number(attempt.score || 0) >= 100)
  const dueTs = quiz?.dueAt ? new Date(quiz.dueAt).getTime() : null

  return hasPerfectScore || submittedCount >= quiz.maxAttempts || (dueTs !== null && dueTs <= nowTs)
}

export function isLectureRevisionUnlocked(lecture, nowTs = new Date().getTime()) {
  const lectureQuizzes = Array.isArray(lecture?.quizzes) ? lecture.quizzes : []
  const moduleQuizzes = Array.isArray(lecture?.module?.quizzes) ? lecture.module.quizzes : []
  const quizzes = lectureQuizzes.length > 0 ? lectureQuizzes : moduleQuizzes

  return quizzes.some((quiz) => isQuizRevisionUnlocked(quiz, nowTs))
}
