import Link from "next/link"
import { redirect } from "next/navigation"
import QuizStatusBadge from "../../components/QuizStatusBadge"
import StudentSwitcher from "../../components/StudentSwitcher"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import * as ui from "../../styles/ui"

function statusLabel(quiz) {
  if (quiz.status === "PUBLISHED") {
    if (quiz.dueAt && new Date(quiz.dueAt) > new Date()) return "Available"
    if (quiz.dueAt && new Date(quiz.dueAt) <= new Date()) return "Closed"
    return "Published"
  }
  return "Upcoming"
}

export default async function StudentQuizzesPage() {
  const studentUser = await getCurrentUser("STUDENT", { id: true, email: true })
  if (!studentUser) redirect("/student/login")

  const availableStudents = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, email: true, studentNumber: true },
    orderBy: [{ studentNumber: "asc" }, { email: "asc" }],
  })

  const quizzes = await prisma.quiz.findMany({
    where: {
      status: "PUBLISHED",
      module: {
        enrollments: {
          some: { userId: studentUser.id, status: "ACTIVE" },
        },
      },
    },
    include: { module: { select: { code: true } } },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
  })

  const attempts = await prisma.quizAttempt.findMany({
    where: { studentId: studentUser.id, status: "SUBMITTED" },
    select: { quizId: true },
  })

  const attemptsByQuiz = attempts.reduce((acc, attempt) => {
    acc[attempt.quizId] = (acc[attempt.quizId] || 0) + 1
    return acc
  }, {})

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student · Quizzes</p>
            <h1 className="text-lg font-semibold">Quiz library</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <StudentSwitcher currentEmail={studentUser.email} students={availableStudents} />
            <Link href="/student" className={ui.buttonSecondary}>Back to dashboard</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Available quizzes</h2>
            <div className="space-y-3 text-sm">
              {quizzes.map((quiz) => (
                <Link key={quiz.id} href={`/student/quizzes/${quiz.id}/start`} className={ui.linkCard}>
                  <p className={ui.textHighlight}>{quiz.module.code}</p>
                  <p className="text-sm font-semibold text-slate-100">{quiz.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <QuizStatusBadge status={statusLabel(quiz)} />
                    <span>Attempts: {attemptsByQuiz[quiz.id] || 0}/{quiz.maxAttempts}</span>
                    <span>Due: {quiz.dueAt ? new Date(quiz.dueAt).toLocaleDateString() : "No due date"}</span>
                  </div>
                </Link>
              ))}
              {quizzes.length === 0 ? <p className={ui.textSmall}>No published quizzes for your active modules.</p> : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
