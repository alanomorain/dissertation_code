import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "../../../../lib/db"
import { getCurrentUser } from "../../../../lib/currentUser"
import * as ui from "../../../../styles/ui"

export default async function LecturerQuizEditPage({ params }) {
  const { id } = await params
  const lecturerUser = await getCurrentUser("LECTURER", { id: true })
  if (!lecturerUser) notFound()

  const quiz = await prisma.quiz.findFirst({
    where: { id, ownerId: lecturerUser.id },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  })

  if (!quiz) notFound()

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Edit Quiz</h1>
            <p className={ui.textSmall}>Quiz ID: {id}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href={`/lecturer/quizzes/${id}`} className={ui.buttonSecondary}>Back to overview</Link>
          </div>
        </div>
      </header>
      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Quiz settings</h2>
            <p className={ui.textSmall}>Editing from this screen will be added next. Current stored data:</p>
            <div className="mt-3 text-sm space-y-1">
              <p><span className={ui.textMuted}>Title:</span> {quiz.title}</p>
              <p><span className={ui.textMuted}>Status:</span> {quiz.status}</p>
              <p><span className={ui.textMuted}>Questions:</span> {quiz.questions.length}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
