import Link from "next/link"
import { notFound } from "next/navigation"
import QuizStatusBadge from "../../../components/QuizStatusBadge"
import { prisma } from "../../../lib/db"
import { getCurrentUser } from "../../../lib/currentUser"
import { formatDisplayDate } from "../../../lib/dateFormat"
import { getModuleDisplayName } from "../../../lib/moduleDisplay"
import * as ui from "../../../styles/ui"

function statusLabel(quiz) {
  const nowTs = Date.now()
  const publishedTs = quiz.publishedAt ? new Date(quiz.publishedAt).getTime() : null
  const dueTs = quiz.dueAt ? new Date(quiz.dueAt).getTime() : null

  if (quiz.status === "PUBLISHED" && publishedTs && publishedTs > nowTs) return "Upcoming"
  if (quiz.status === "PUBLISHED" && dueTs && dueTs < nowTs) return "Closed"
  return quiz.status
}

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
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/lecturer/quizzes" className={ui.buttonSecondary}>Back to Quizzes</Link>
            <Link href={`/lecturer/quizzes/${id}/edit`} className={ui.buttonSecondary}>Edit Quiz</Link>
            <Link href={`/lecturer/quizzes/${id}/results`} className={ui.buttonPrimary}>View Results</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Quiz summary</h2>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <p><span className={ui.textMuted}>Module:</span> {getModuleDisplayName(quiz.module)}</p>
              <p className="flex items-center gap-2"><span className={ui.textMuted}>Status:</span><QuizStatusBadge status={statusLabel(quiz)} /></p>
              <p><span className={ui.textMuted}>Questions:</span> {quiz.questions.length}</p>
              <p><span className={ui.textMuted}>Attempts:</span> {quiz._count.attempts}</p>
              <p><span className={ui.textMuted}>Release:</span> {formatDisplayDate(quiz.publishedAt, "Not scheduled")}</p>
              <p><span className={ui.textMuted}>Due:</span> {formatDisplayDate(quiz.dueAt, "Not set")}</p>
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Question preview</h2>
            <div className="space-y-3 text-sm">
              {quiz.questions.map((question) => (
                <div key={question.id} className={ui.cardInner}>
                  <p className="text-xs text-stone-600">{question.type} · {question.difficulty}</p>
                  <p className="mt-2 text-stone-950">{question.prompt}</p>
                  {question.options.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-xs text-stone-700">
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
