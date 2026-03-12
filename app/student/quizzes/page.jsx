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
import StudentModuleQuizCard from "./components/StudentModuleQuizCard"

function badgeForState(state, quiz, nowTs) {
  const dueTs = quiz.dueAt ? new Date(quiz.dueAt).getTime() : null
  if (state === "UPCOMING") return "Upcoming"
  if (state === "COMPLETED" && dueTs && dueTs < nowTs) return "Closed"
  if (state === "COMPLETED") return "Completed"
  if (state === "IN_PROGRESS") return "In progress"
  return "To do"
}

export default async function StudentQuizzesPage() {
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
    orderBy: [{ module: { code: "asc" } }, { dueAt: "asc" }, { createdAt: "desc" }],
  })

  const attempts = await prisma.quizAttempt.findMany({
    where: { studentId: studentUser.id },
    select: { quizId: true, status: true, score: true },
  })

  const attemptStatsByQuiz = createStudentAttemptStats(attempts)

  const moduleMap = quizzes.reduce((acc, quiz) => {
    if (!acc[quiz.module.code]) {
      acc[quiz.module.code] = {
        moduleCode: quiz.module.code,
        moduleName: quiz.module.name,
        quizzes: [],
        counts: {
          TO_DO: 0,
          IN_PROGRESS: 0,
          COMPLETED: 0,
          UPCOMING: 0,
        },
      }
    }

    const stats = attemptStatsByQuiz[quiz.id] || { submittedCount: 0, inProgressCount: 0, bestScore: null }
    const state = getStudentQuizProgressState(quiz, stats, nowTs)
    const badgeStatus = badgeForState(state, quiz, nowTs)

    acc[quiz.module.code].counts[state] += 1
    acc[quiz.module.code].quizzes.push({
      id: quiz.id,
      title: quiz.title,
      state,
      badgeStatus,
      submittedAttempts: stats.submittedCount,
      maxAttempts: quiz.maxAttempts,
      bestScore: stats.bestScore,
      releaseText: quiz.publishedAt ? new Date(quiz.publishedAt).toLocaleString() : "Available now",
      dueText: quiz.dueAt ? new Date(quiz.dueAt).toLocaleDateString() : "No due date",
      dueAtTs: quiz.dueAt ? new Date(quiz.dueAt).getTime() : null,
    })

    return acc
  }, {})

  const moduleGroups = Object.values(moduleMap).map((group) => ({
    ...group,
    quizzes: group.quizzes.sort((a, b) => {
      const priority = { TO_DO: 0, IN_PROGRESS: 1, COMPLETED: 2, UPCOMING: 3 }
      const first = priority[a.state] - priority[b.state]
      if (first !== 0) return first
      return (a.dueAtTs || Number.MAX_SAFE_INTEGER) - (b.dueAtTs || Number.MAX_SAFE_INTEGER)
    }),
  }))

  const statusTotals = moduleGroups.reduce(
    (acc, moduleGroup) => {
      acc.TO_DO += moduleGroup.counts.TO_DO
      acc.IN_PROGRESS += moduleGroup.counts.IN_PROGRESS
      acc.COMPLETED += moduleGroup.counts.COMPLETED
      acc.UPCOMING += moduleGroup.counts.UPCOMING
      return acc
    },
    { TO_DO: 0, IN_PROGRESS: 0, COMPLETED: 0, UPCOMING: 0 },
  )

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student · Quizzes</p>
            <h1 className="text-lg font-semibold">Quiz library</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <SignOutButton />
            <Link href="/student" className={ui.buttonSecondary}>Back to dashboard</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className="mx-auto grid w-full max-w-[1260px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={`${ui.card} p-4`}>
              <p className={ui.textLabel}>To do</p>
              <p className="text-2xl font-semibold">{statusTotals.TO_DO}</p>
            </div>
            <div className={`${ui.card} p-4`}>
              <p className={ui.textLabel}>In progress</p>
              <p className="text-2xl font-semibold">{statusTotals.IN_PROGRESS}</p>
            </div>
            <div className={`${ui.card} p-4`}>
              <p className={ui.textLabel}>Completed</p>
              <p className="text-2xl font-semibold">{statusTotals.COMPLETED}</p>
            </div>
            <div className={`${ui.card} p-4`}>
              <p className={ui.textLabel}>Upcoming</p>
              <p className="text-2xl font-semibold">{statusTotals.UPCOMING}</p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[960px] space-y-6">
            {moduleGroups.length === 0 ? (
              <div className={ui.cardFull}>
                <h2 className={ui.cardHeader}>Quiz library</h2>
                <p className={ui.textSmall}>No published quizzes for your active modules right now.</p>
              </div>
            ) : (
              moduleGroups.map((group) => <StudentModuleQuizCard key={group.moduleCode} moduleGroup={group} />)
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
