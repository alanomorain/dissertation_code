import Link from "next/link"
import { notFound } from "next/navigation"
import QuizStatusBadge from "../../../components/QuizStatusBadge"
import { prisma } from "../../../lib/db"
import { getCurrentUser } from "../../../lib/currentUser"
import * as ui from "../../../styles/ui"

export default async function LecturerQuizDetailPage({ params }) {
  const { id } = await params
  const lecturerUser = await getCurrentUser("LECTURER", { id: true })
  if (!lecturerUser) notFound()

  const quiz = await prisma.quiz.findFirst({
    where: { id, ownerId: lecturerUser.id },
    include: {
      module: true,
      questions: { include: { options: true }, orderBy: { orderIndex: "asc" } },
      _count: { select: { attempts: true } },
    },
  })

  if (!quiz) notFound()

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Quiz Overview</h1>
            <p className={ui.textSmall}>{quiz.title}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/lecturer/quizzes" className={ui.buttonSecondary}>Back to quizzes</Link>
            <Link href={`/lecturer/quizzes/${id}/results`} className={ui.buttonPrimary}>View results</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Quiz summary</h2>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <p><span className={ui.textMuted}>Module:</span> {quiz.module.code}</p>
              <p className="flex items-center gap-2"><span className={ui.textMuted}>Status:</span><QuizStatusBadge status={quiz.status} /></p>
              <p><span className={ui.textMuted}>Questions:</span> {quiz.questions.length}</p>
              <p><span className={ui.textMuted}>Attempts:</span> {quiz._count.attempts}</p>
              <p><span className={ui.textMuted}>Due:</span> {quiz.dueAt ? new Date(quiz.dueAt).toLocaleString() : "Not set"}</p>
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Question preview</h2>
            <div className="space-y-3 text-sm">
              {quiz.questions.map((question) => (
                <div key={question.id} className={ui.cardInner}>
                  <p className="text-xs text-slate-400">{question.type} · {question.difficulty}</p>
                  <p className="mt-2 text-slate-100">{question.prompt}</p>
                  {question.options.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-xs text-slate-300">
                      {question.options.map((option) => (
                        <li key={option.id}>{option.isCorrect ? "✓" : "•"} {option.text}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
