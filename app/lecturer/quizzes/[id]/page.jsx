import Link from "next/link"
import QuizStatusBadge from "../../../components/QuizStatusBadge"
import * as ui from "../../../styles/ui"

export default function LecturerQuizDetailPage({ params }) {
  const { id } = params

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Quiz Overview</h1>
            <p className={ui.textSmall}>Quiz ID: {id}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/lecturer/quizzes" className={ui.buttonSecondary}>
              Back to quizzes
            </Link>
            <Link href={`/lecturer/quizzes/${id}/edit`} className={ui.buttonSecondary}>
              Edit
            </Link>
            <Link href={`/lecturer/quizzes/${id}/results`} className={ui.buttonPrimary}>
              View results
            </Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Quiz summary</h2>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <p><span className={ui.textMuted}>Module:</span> CSC7058</p>
              <p className="flex items-center gap-2">
                <span className={ui.textMuted}>Status:</span>
                <QuizStatusBadge status="Draft" />
              </p>
              <p><span className={ui.textMuted}>Questions:</span> 12</p>
              <p><span className={ui.textMuted}>Time limit:</span> 20 minutes</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" className={ui.buttonPrimary}>Publish</button>
              <button type="button" className={ui.buttonSecondary}>Unpublish</button>
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Question preview</h2>
            <div className="space-y-3 text-sm">
              <div className={ui.cardInner}>
                <p className="text-xs text-slate-400">MCQ · Medium</p>
                <p className="mt-2 text-slate-100">Which statement best describes microservices?</p>
              </div>
              <div className={ui.cardInner}>
                <p className="text-xs text-slate-400">Short answer · Hard</p>
                <p className="mt-2 text-slate-100">Explain how containerization improves deployment.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
