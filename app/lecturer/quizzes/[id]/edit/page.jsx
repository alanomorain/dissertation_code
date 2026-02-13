import Link from "next/link"
import * as ui from "../../../../styles/ui"

export default function LecturerQuizEditPage({ params }) {
  const { id } = params

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Edit Quiz</h1>
            <p className={ui.textSmall}>Quiz ID: {id}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href={`/lecturer/quizzes/${id}`} className={ui.buttonSecondary}>
              Back to overview
            </Link>
            <button type="button" className={ui.buttonPrimary}>Save changes</button>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Quiz settings</h2>
            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div className="space-y-2">
                <label className="font-medium">Title</label>
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                  placeholder="Microservices check-in"
                />
              </div>
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Questions</h2>
            <div className="space-y-3 text-sm">
              <div className={ui.cardInner}>
                <p className="text-xs text-slate-400">MCQ · Medium</p>
                <textarea
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                  defaultValue="Which statement best describes microservices?"
                />
                <div className="mt-3 flex gap-2">
                  <button type="button" className={ui.buttonSecondary}>Regenerate</button>
                  <button type="button" className={ui.buttonSecondary}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
