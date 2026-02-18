import Link from "next/link"
import QuizStatusBadge from "../../components/QuizStatusBadge"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import * as ui from "../../styles/ui"

function toBadgeStatus(status, dueAt) {
  if (status === "PUBLISHED" && dueAt && new Date(dueAt) > new Date()) return "Available"
  if (status === "PUBLISHED") return "Published"
  if (status === "ARCHIVED") return "Archived"
  return "Draft"
}

export default async function LecturerQuizzesPage() {
  const lecturerUser = await getCurrentUser("LECTURER", { id: true })

  const quizzes = lecturerUser
    ? await prisma.quiz.findMany({
        where: { ownerId: lecturerUser.id },
        include: {
          module: { select: { code: true } },
          _count: { select: { questions: true, attempts: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : []

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Quizzes</h1>
            <p className={ui.textSmall}>Create, publish, and review quiz performance.</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/lecturer" className={ui.buttonSecondary}>
              Back to dashboard
            </Link>
            <Link href="/lecturer/quizzes/new" className={ui.buttonPrimary}>
              + New quiz
            </Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={ui.cardHeader}>All quizzes</h2>
            </div>

            {quizzes.length === 0 ? (
              <p className={ui.textSmall}>No quizzes yet. Create one to get started.</p>
            ) : (
              <div className="space-y-3 text-sm">
                {quizzes.map((quiz) => (
                  <Link
                    key={quiz.id}
                    href={`/lecturer/quizzes/${quiz.id}`}
                    className={`${ui.cardList} flex flex-col gap-2 md:flex-row md:items-center md:justify-between hover:border-indigo-400 transition`}
                  >
                    <div>
                      <p className={ui.textHighlight}>{quiz.title}</p>
                      <p className="font-medium">Module: {quiz.module.code}</p>
                      <p className="text-xs text-slate-400">
                        {quiz._count.questions} questions · {quiz._count.attempts} attempts
                      </p>
                      <p className="text-xs text-slate-500">
                        Created: {new Date(quiz.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 md:flex-col md:items-end">
                      <QuizStatusBadge status={toBadgeStatus(quiz.status, quiz.dueAt)} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
