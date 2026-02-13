import Link from "next/link"
import * as ui from "../../../../styles/ui"

export default function StudentQuizTakePage({ params }) {
  const { id } = params

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student · Quiz</p>
            <h1 className="text-lg font-semibold">Quiz in progress</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href={`/student/quizzes/${id}/start`} className={ui.buttonSecondary}>
              Exit
            </Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Question 1 of 12</span>
            </div>
            <h2 className="mt-3 text-base font-semibold">Which statement best describes microservices?</h2>
            <div className="mt-4 space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="answer" />
                <span>Independent services that communicate via APIs.</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="answer" />
                <span>A single monolithic deployment unit.</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="answer" />
                <span>Only front-end components.</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button type="button" className={ui.buttonSecondary}>Previous</button>
            <button type="button" className={ui.buttonPrimary}>Next question</button>
          </div>
        </div>
      </section>
    </main>
  )
}
