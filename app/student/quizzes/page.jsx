import Link from "next/link"
import QuizStatusBadge from "../../components/QuizStatusBadge"
import * as ui from "../../styles/ui"

const sampleQuizzes = [
  {
    id: "quiz-2",
    title: "Microservices Patterns Check-in",
    module: "CSC7058",
    status: "Available",
    due: "Feb 18",
  },
  {
    id: "quiz-3",
    title: "Database Indexing Fundamentals",
    module: "CSC7082",
    status: "Upcoming",
    due: "Feb 22",
  },
]

export default function StudentQuizzesPage() {
  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student · Quizzes</p>
            <h1 className="text-lg font-semibold">Quiz library</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/student" className={ui.buttonSecondary}>
              Back to dashboard
            </Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Available quizzes</h2>
            <div className="space-y-3 text-sm">
              {sampleQuizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  href={`/student/quizzes/${quiz.id}/start`}
                  className={ui.linkCard}
                >
                  <p className={ui.textHighlight}>{quiz.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>Module: {quiz.module}</span>
                    <span>·</span>
                    <QuizStatusBadge status={quiz.status} />
                    <span>·</span>
                    <span>Due: {quiz.due}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
