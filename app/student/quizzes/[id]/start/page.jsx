import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "../../../../lib/db"
import { getCurrentUser } from "../../../../lib/currentUser"
import { formatDisplayDate } from "../../../../lib/dateFormat"
import * as ui from "../../../../styles/ui"
import StudentPageHeader from "../../../components/StudentPageHeader"

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
  const dueDate = formatDisplayDate(dueAt, "Any time")
  const isClosed = dueAt ? dueAt.getTime() <= now.getTime() : false

  return (
    <main className={ui.page}>
      <StudentPageHeader
        label="Student · Quiz"
        title="Ready to Start?"
        subtitle={quiz.title}
        actions={<Link href="/student/quizzes" className={ui.buttonSecondary}>All Quizzes</Link>}
      />

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className="grid gap-4 md:grid-cols-4 text-sm">
            <div className={ui.cardFull}><p className={ui.textLabel}>Questions</p><p className="mt-2 text-2xl font-semibold">{quiz._count.questions}</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>Attempts used</p><p className="mt-2 text-2xl font-semibold">{submittedAttempts}/{quiz.maxAttempts}</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>Best score</p><p className="mt-2 text-2xl font-semibold">{bestScore === null ? "N/A" : `${bestScore}%`}</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>Due</p><p className="mt-2 text-2xl font-semibold">{dueDate}</p></div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Quiz Overview</h2>
            <p className="font-semibold text-stone-950">{quiz.title}</p>
            <p className="mt-1 text-sm text-stone-600">
              Due {dueDate.toLowerCase()} · {quiz._count.questions} questions
            </p>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Previous Attempts</h2>
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
                          Submitted: {formatDisplayDate(attempt.submittedAt, "Not submitted")}
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

          <div className="flex flex-wrap gap-3">
            {isClosed ? (
              <p className="text-sm text-amber-700">This quiz closed on {dueDate}.</p>
            ) : submittedAttempts >= quiz.maxAttempts ? (
              <p className="text-sm text-amber-700">You have reached the attempt limit for this quiz.</p>
            ) : (
              <Link href={`/student/quizzes/${id}/take`} className={ui.buttonPrimary}>Start Quiz</Link>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
