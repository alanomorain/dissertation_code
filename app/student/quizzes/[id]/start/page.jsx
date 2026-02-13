import Link from "next/link"
import * as ui from "../../../../styles/ui"

export default function StudentQuizStartPage({ params }) {
  const { id } = params

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student · Quiz</p>
            <h1 className="text-lg font-semibold">Ready to start?</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/student/quizzes" className={ui.buttonSecondary}>
              Back to quizzes
            </Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Quiz overview</h2>
            <div className="space-y-2 text-sm">
              <p><span className={ui.textMuted}>Quiz ID:</span> {id}</p>
              <p><span className={ui.textMuted}>Questions:</span> 12</p>
              <p><span className={ui.textMuted}>Attempts:</span> 1</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href={`/student/quizzes/${id}/take`} className={ui.buttonPrimary}>
              Start quiz
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
