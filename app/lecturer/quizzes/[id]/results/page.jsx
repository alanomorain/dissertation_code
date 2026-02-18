import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "../../../../lib/db"
import { getCurrentUser } from "../../../../lib/currentUser"
import * as ui from "../../../../styles/ui"

export default async function LecturerQuizResultsPage({ params }) {
  const { id } = await params
  const lecturerUser = await getCurrentUser("LECTURER", { id: true })
  if (!lecturerUser) notFound()

  const quiz = await prisma.quiz.findFirst({
    where: { id, ownerId: lecturerUser.id },
    include: {
      questions: { select: { id: true, prompt: true } },
      attempts: {
        where: { status: "SUBMITTED" },
        include: {
          student: { select: { email: true } },
          responses: true,
        },
      },
    },
  })

  if (!quiz) notFound()

  const attempts = quiz.attempts
  const averageScore = attempts.length
    ? Math.round(attempts.reduce((acc, item) => acc + (item.score || 0), 0) / attempts.length)
    : 0

  const completionRate = 100

  const questionPerformance = quiz.questions.map((question) => {
    const related = attempts.flatMap((a) => a.responses.filter((r) => r.questionId === question.id))
    const withMarks = related.filter((r) => typeof r.isCorrect === "boolean")
    const pct = withMarks.length
      ? Math.round((withMarks.filter((r) => r.isCorrect).length / withMarks.length) * 100)
      : 0
    return { id: question.id, prompt: question.prompt, correctPct: pct }
  })

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Quiz Results</h1>
            <p className={ui.textSmall}>{quiz.title}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href={`/lecturer/quizzes/${id}`} className={ui.buttonSecondary}>Back to overview</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className={`${ui.card} p-4`}><p className={`${ui.textLabel} mb-1`}>Attempts</p><p className="text-2xl font-semibold">{attempts.length}</p></div>
            <div className={`${ui.card} p-4`}><p className={`${ui.textLabel} mb-1`}>Average score</p><p className="text-2xl font-semibold">{averageScore}%</p></div>
            <div className={`${ui.card} p-4`}><p className={`${ui.textLabel} mb-1`}>Completion rate</p><p className="text-2xl font-semibold">{completionRate}%</p></div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Question performance</h2>
            <div className="space-y-3 text-sm">
              {questionPerformance.map((q) => (
                <div key={q.id} className={ui.cardInner}>
                  <p className="text-slate-200">{q.prompt}</p>
                  <p className="text-xs text-slate-400">Correct: {q.correctPct}%</p>
                </div>
              ))}
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Student results</h2>
            <div className="space-y-3 text-sm">
              {attempts.map((attempt) => (
                <div key={attempt.id} className={ui.cardInner}>
                  <p className="font-medium">{attempt.student.email}</p>
                  <p className="text-xs text-slate-400">Score: {attempt.score || 0}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
