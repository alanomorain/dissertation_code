import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "../../../../lib/db"
import { getCurrentUser } from "../../../../lib/currentUser"
import * as ui from "../../../../styles/ui"

export default async function StudentQuizStartPage({ params }) {
  const { id } = await params
  const studentUser = await getCurrentUser("STUDENT", { id: true })
  if (!studentUser) notFound()

  const now = new Date()
  const quiz = await prisma.quiz.findFirst({
    where: {
      id,
      status: "PUBLISHED",
      OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
      module: { enrollments: { some: { userId: studentUser.id, status: "ACTIVE" } } },
    },
    include: { _count: { select: { questions: true } } },
  })

  if (!quiz) notFound()

  const submittedAttempts = await prisma.quizAttempt.count({
    where: { quizId: quiz.id, studentId: studentUser.id, status: "SUBMITTED" },
  })
  const previousAttempts = await prisma.quizAttempt.findMany({
    where: { quizId: quiz.id, studentId: studentUser.id, status: "SUBMITTED" },
    select: {
      id: true,
      score: true,
      submittedAt: true,
    },
    orderBy: { submittedAt: "desc" },
    take: 10,
  })

  const bestScore = previousAttempts.length
    ? Math.max(...previousAttempts.map((attempt) => attempt.score || 0))
    : null
  const dueAt = quiz.dueAt ? new Date(quiz.dueAt) : null
  const isClosed = dueAt ? dueAt.getTime() <= now.getTime() : false

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student · Quiz</p>
            <h1 className="text-lg font-semibold">Ready to start?</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/student/quizzes" className={ui.buttonSecondary}>Back to quizzes</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Quiz overview</h2>
            <div className="space-y-2 text-sm">
              <p><span className={ui.textMuted}>Title:</span> {quiz.title}</p>
              <p><span className={ui.textMuted}>Questions:</span> {quiz._count.questions}</p>
              <p><span className={ui.textMuted}>Attempts used:</span> {submittedAttempts} / {quiz.maxAttempts}</p>
              <p><span className={ui.textMuted}>Best score:</span> {bestScore === null ? "No attempts yet" : `${bestScore}%`}</p>
              <p><span className={ui.textMuted}>Due:</span> {dueAt ? dueAt.toLocaleString() : "No due date"}</p>
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Previous attempts</h2>
            {previousAttempts.length === 0 ? (
              <p className={ui.textSmall}>No previous submitted attempts yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {previousAttempts.map((attempt, index) => (
                  <div key={attempt.id} className={ui.cardInner}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-stone-950">Attempt #{submittedAttempts - index}</p>
                        <p className="text-xs text-stone-600">
                          Submitted: {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "Not submitted"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-stone-800">{attempt.score ?? 0}%</span>
                        <Link href={`/student/quizzes/${id}/results?attemptId=${encodeURIComponent(attempt.id)}`} className={ui.buttonSmall}>
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {isClosed ? (
              <p className="text-sm text-amber-700">This quiz closed on {dueAt.toLocaleString()}.</p>
            ) : submittedAttempts >= quiz.maxAttempts ? (
              <p className="text-sm text-amber-700">You have reached the attempt limit for this quiz.</p>
            ) : (
              <Link href={`/student/quizzes/${id}/take`} className={ui.buttonPrimary}>Start quiz</Link>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
