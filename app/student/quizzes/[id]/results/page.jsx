import Link from "next/link"
import * as ui from "../../../../styles/ui"

export default function StudentQuizResultsPage({ params }) {
  const { id } = params

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student · Results</p>
            <h1 className="text-lg font-semibold">Your results</h1>
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
            <h2 className={ui.cardHeader}>Quiz summary</h2>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <p><span className={ui.textMuted}>Quiz ID:</span> {id}</p>
              <p><span className={ui.textMuted}>Score:</span> 82%</p>
              <p><span className={ui.textMuted}>Correct:</span> 10 / 12</p>
              <p><span className={ui.textMuted}>Time:</span> 16m 20s</p>
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Question feedback</h2>
            <div className="space-y-3 text-sm">
              <div className={ui.cardInner}>
                <p className="text-slate-200">Q1: Microservices definition</p>
                <p className="text-xs text-slate-400">Correct</p>
              </div>
              <div className={ui.cardInner}>
                <p className="text-slate-200">Q2: Query optimization</p>
                <p className="text-xs text-slate-400">Needs review</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
