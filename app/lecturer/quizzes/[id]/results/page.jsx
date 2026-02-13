import Link from "next/link"
import * as ui from "../../../../styles/ui"

export default function LecturerQuizResultsPage({ params }) {
  const { id } = params

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Quiz Results</h1>
            <p className={ui.textSmall}>Quiz ID: {id}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href={`/lecturer/quizzes/${id}`} className={ui.buttonSecondary}>
              Back to overview
            </Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className={`${ui.card} p-4`}>
              <p className={`${ui.textLabel} mb-1`}>Attempts</p>
              <p className="text-2xl font-semibold">42</p>
            </div>
            <div className={`${ui.card} p-4`}>
              <p className={`${ui.textLabel} mb-1`}>Average score</p>
              <p className="text-2xl font-semibold">78%</p>
            </div>
            <div className={`${ui.card} p-4`}>
              <p className={`${ui.textLabel} mb-1`}>Completion rate</p>
              <p className="text-2xl font-semibold">92%</p>
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Question performance</h2>
            <div className="space-y-3 text-sm">
              <div className={ui.cardInner}>
                <p className="text-slate-200">Q1: Microservices definition</p>
                <p className="text-xs text-slate-400">Correct: 88%</p>
              </div>
              <div className={ui.cardInner}>
                <p className="text-slate-200">Q2: Containerization benefits</p>
                <p className="text-xs text-slate-400">Correct: 61%</p>
              </div>
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Student results</h2>
            <div className="space-y-3 text-sm">
              <div className={ui.cardInner}>
                <p className="font-medium">student001@example.com</p>
                <p className="text-xs text-slate-400">Score: 86%</p>
              </div>
              <div className={ui.cardInner}>
                <p className="font-medium">student002@example.com</p>
                <p className="text-xs text-slate-400">Score: 73%</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
