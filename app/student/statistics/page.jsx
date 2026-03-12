import Link from "next/link"
import { redirect } from "next/navigation"
import SignOutButton from "../../components/SignOutButton"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import {
  createStudentAttemptStats,
  getStudentQuizProgressState,
} from "../../lib/quizState"
import * as ui from "../../styles/ui"

export default async function StudentStatisticsPage() {
  const studentUser = await getCurrentUser("STUDENT", { id: true, email: true })
  if (!studentUser) redirect("/student/login")

  const nowTs = new Date().getTime()
  const quizzes = await prisma.quiz.findMany({
    where: {
      status: "PUBLISHED",
      module: {
        enrollments: {
          some: { userId: studentUser.id, status: "ACTIVE" },
        },
      },
    },
    include: { module: { select: { code: true, name: true } } },
  })

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      studentId: studentUser.id,
      quiz: {
        status: "PUBLISHED",
        module: {
          enrollments: {
            some: { userId: studentUser.id, status: "ACTIVE" },
          },
        },
      },
    },
    select: {
      quizId: true,
      status: true,
      score: true,
      submittedAt: true,
      quiz: { select: { module: { select: { code: true } } } },
    },
    orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
  })

  const analogyViews = await prisma.analogyInteraction.count({
    where: { userId: studentUser.id },
  })

  const attemptStatsByQuiz = createStudentAttemptStats(attempts)
  const submittedAttempts = attempts.filter((attempt) => attempt.status === "SUBMITTED")

  const averageScore = submittedAttempts.length
    ? Math.round(submittedAttempts.reduce((total, attempt) => total + (attempt.score || 0), 0) / submittedAttempts.length)
    : 0

  const stateTotals = quizzes.reduce(
    (acc, quiz) => {
      const state = getStudentQuizProgressState(quiz, attemptStatsByQuiz[quiz.id], nowTs)
      acc[state] += 1
      return acc
    },
    { TO_DO: 0, IN_PROGRESS: 0, COMPLETED: 0, UPCOMING: 0 },
  )

  const modulePerformanceMap = quizzes.reduce((acc, quiz) => {
      const code = quiz.module.code
      if (!acc[code]) {
        acc[code] = {
          code,
          attempts: 0,
          totalScore: 0,
          toDo: 0,
          inProgress: 0,
          completed: 0,
          upcoming: 0,
        }
      }

      const stats = attemptStatsByQuiz[quiz.id] || { submittedCount: 0, inProgressCount: 0, bestScore: null }
      const state = getStudentQuizProgressState(quiz, stats, nowTs)
      if (state === "TO_DO") acc[code].toDo += 1
      if (state === "IN_PROGRESS") acc[code].inProgress += 1
      if (state === "COMPLETED") acc[code].completed += 1
      if (state === "UPCOMING") acc[code].upcoming += 1

      return acc
    }, {})

  submittedAttempts.forEach((attempt) => {
    const code = attempt.quiz.module.code
    if (!modulePerformanceMap[code]) return
    modulePerformanceMap[code].attempts += 1
    modulePerformanceMap[code].totalScore += attempt.score || 0
  })

  const modulePerformance = Object.values(modulePerformanceMap).sort((a, b) => a.code.localeCompare(b.code))

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student · Statistics</p>
            <h1 className="text-lg font-semibold">Performance overview</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <SignOutButton />
            <Link href="/student" className={ui.buttonSecondary}>Back to dashboard</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} ${ui.pageSpacing}`}>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <div className={ui.cardFull}><p className={ui.textLabel}>Submitted attempts</p><p className="mt-2 text-2xl font-semibold">{submittedAttempts.length}</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>Average score</p><p className="mt-2 text-2xl font-semibold">{averageScore}%</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>Analogy views</p><p className="mt-2 text-2xl font-semibold">{analogyViews}</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>To do</p><p className="mt-2 text-2xl font-semibold">{stateTotals.TO_DO}</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>In progress</p><p className="mt-2 text-2xl font-semibold">{stateTotals.IN_PROGRESS}</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>Completed / Upcoming</p><p className="mt-2 text-2xl font-semibold">{stateTotals.COMPLETED} / {stateTotals.UPCOMING}</p></div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Module performance</h2>
            <div className="space-y-3 text-sm">
              {modulePerformance.map((item) => (
                <div key={item.code} className={ui.cardList}>
                  <p className="font-medium">{item.code}</p>
                  <p className="text-xs text-slate-400">
                    To do: {item.toDo} · In progress: {item.inProgress} · Completed: {item.completed} · Upcoming: {item.upcoming}
                  </p>
                  <p className="text-xs text-slate-400">
                    Submitted attempts: {item.attempts} · Average score: {item.attempts ? Math.round(item.totalScore / item.attempts) : 0}%
                  </p>
                </div>
              ))}
              {modulePerformance.length === 0 ? <p className={ui.textSmall}>No quiz attempts submitted yet.</p> : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
