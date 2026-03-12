import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "../../../../lib/db"
import { getCurrentUser } from "../../../../lib/currentUser"
import * as ui from "../../../../styles/ui"

export default async function StudentQuizResultsPage({ params, searchParams }) {
  const { id } = await params
  const attemptId = (await searchParams).attemptId
  const studentUser = await getCurrentUser("STUDENT", { id: true })
  if (!studentUser) notFound()

  const attempt = await prisma.quizAttempt.findFirst({
    where: {
      id: attemptId || undefined,
      quizId: id,
      studentId: studentUser.id,
      status: "SUBMITTED",
    },
    include: {
      quiz: true,
      responses: { include: { question: true } },
    },
    orderBy: { submittedAt: "desc" },
  })

  if (!attempt) notFound()

  const gradedResponses = attempt.responses.filter((r) => typeof r.isCorrect === "boolean")
  const correct = gradedResponses.filter((r) => r.isCorrect).length
  const scoreFromResponses = gradedResponses.length
    ? Math.round((correct / gradedResponses.length) * 100)
    : (attempt.score || 0)

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student · Results</p>
            <h1 className="text-lg font-semibold">Your results</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/student/quizzes" className={ui.buttonSecondary}>Back to quizzes</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Quiz summary</h2>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <p><span className={ui.textMuted}>Quiz:</span> {attempt.quiz.title}</p>
              <p><span className={ui.textMuted}>Score:</span> {scoreFromResponses}%</p>
              <p><span className={ui.textMuted}>Auto-graded:</span> {correct} / {gradedResponses.length}</p>
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Question feedback</h2>
            <div className="space-y-3 text-sm">
              {attempt.responses.map((response) => (
                <div key={response.id} className={ui.cardInner}>
                  <p className="text-slate-200">{response.question.prompt}</p>
                  <p className="text-xs text-slate-400">{response.isCorrect ? "Correct" : "Needs review"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
