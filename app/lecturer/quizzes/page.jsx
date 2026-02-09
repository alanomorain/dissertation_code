import Link from "next/link"
import * as ui from "../../styles/ui"

const sampleQuizzes = [
  {
    id: "quiz-1",
    title: "Database Indexing Fundamentals",
    module: "CSC7082",
    status: "Draft",
    questions: 12,
    createdAt: "2026-02-08T10:00:00Z",
  },
  {
    id: "quiz-2",
    title: "Microservices Patterns Check-in",
    module: "CSC7058",
    status: "Published",
    questions: 15,
    createdAt: "2026-02-05T14:30:00Z",
  },
]

export default function LecturerQuizzesPage() {
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

            <div className="space-y-3 text-sm">
              {sampleQuizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  href={`/lecturer/quizzes/${quiz.id}`}
                  className={`${ui.cardList} flex flex-col gap-2 md:flex-row md:items-center md:justify-between hover:border-indigo-400 transition`}
                >
                  <div>
                    <p className={ui.textHighlight}>{quiz.title}</p>
                    <p className="font-medium">Module: {quiz.module}</p>
                    <p className="text-xs text-slate-400">
                      {quiz.questions} questions · Status: {quiz.status}
                    </p>
                    <p className="text-xs text-slate-500">
                      Created: {new Date(quiz.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 md:flex-col md:items-end">
                    <span className={ui.buttonSmall}>{quiz.status}</span>
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
