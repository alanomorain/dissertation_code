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

function StackedPipelineBar({ toDo, inProgress, completed }) {
  const total = toDo + inProgress + completed
  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0
  const inProgressPct = total > 0 ? Math.round((inProgress / total) * 100) : 0
  const toDoPct = Math.max(0, 100 - completedPct - inProgressPct)

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 p-4">
      <div className="h-4 overflow-visible rounded-full bg-slate-800/90">
        <div className="flex h-full w-full">
          <div
            className="group relative bg-emerald-500 transition-all"
            style={{ width: `${completedPct}%` }}
          >
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 opacity-0 shadow-md transition-opacity group-hover:opacity-100">
              Completed: {completed}
            </span>
          </div>
          <div
            className="group relative bg-amber-500 transition-all"
            style={{ width: `${inProgressPct}%` }}
          >
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 opacity-0 shadow-md transition-opacity group-hover:opacity-100">
              In progress: {inProgress}
            </span>
          </div>
          <div
            className="group relative bg-slate-500 transition-all"
            style={{ width: `${toDoPct}%` }}
          >
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 opacity-0 shadow-md transition-opacity group-hover:opacity-100">
              To do: {toDo}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScoreTrendSparkline({ scores }) {
  if (!scores || scores.length === 0) {
    return <p className="text-xs text-slate-400">No submitted quiz scores yet.</p>
  }

  if (scores.length === 1) {
    return (
      <div className="rounded-md border border-slate-800/60 bg-slate-900/70 px-3 py-2">
        <p className="text-xs text-slate-300">Only one score available: <span className="font-semibold text-slate-100">{scores[0]}%</span></p>
      </div>
    )
  }

  const width = 260
  const height = 70
  const min = 0
  const max = 100
  const points = scores.map((score, index) => {
    const x = (index / (scores.length - 1)) * width
    const y = height - ((score - min) / (max - min)) * height
    return `${x},${y}`
  }).join(" ")

  const last = scores[scores.length - 1]
  const first = scores[0]

  return (
    <div className="rounded-md border border-slate-800/60 bg-slate-900/70 p-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-20 w-full">
        <polyline fill="none" stroke="#22c55e" strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-xs text-slate-400">
        {first}% → {last}%
      </p>
    </div>
  )
}

function CompletedMiniBar({ completed, total }) {
  const safeTotal = Math.max(total || 0, 0)
  const safeCompleted = Math.max(completed || 0, 0)
  const completedPct = safeTotal > 0 ? Math.round((safeCompleted / safeTotal) * 100) : 0
  const remainingPct = Math.max(0, 100 - completedPct)
  const remaining = Math.max(0, safeTotal - safeCompleted)

  return (
    <div className="rounded-md border border-slate-800/60 bg-slate-900/70 p-3">
      <div className="h-4 overflow-visible rounded-full bg-slate-800/90">
        <div className="flex h-full w-full">
          <div className="group relative bg-emerald-500 transition-all" style={{ width: `${completedPct}%` }}>
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 opacity-0 shadow-md transition-opacity group-hover:opacity-100">
              Completed: {safeCompleted}
            </span>
          </div>
          <div className="group relative bg-slate-600 transition-all" style={{ width: `${remainingPct}%` }}>
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 opacity-0 shadow-md transition-opacity group-hover:opacity-100">
              Remaining: {remaining}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const accessibleQuizTotal = stateTotals.TO_DO + stateTotals.IN_PROGRESS + stateTotals.COMPLETED

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
          scoreTrend: [],
        }
      }

      const stats = attemptStatsByQuiz[quiz.id] || { submittedCount: 0, inProgressCount: 0, bestScore: null }
      const state = getStudentQuizProgressState(quiz, stats, nowTs)
      if (state === "TO_DO") acc[code].toDo += 1
      if (state === "IN_PROGRESS") acc[code].inProgress += 1
      if (state === "COMPLETED") acc[code].completed += 1

      return acc
    }, {})

  const submittedAttemptsChronological = [...submittedAttempts].sort(
    (a, b) => new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime(),
  )

  submittedAttemptsChronological.forEach((attempt) => {
    const code = attempt.quiz.module.code
    if (!modulePerformanceMap[code]) return
    modulePerformanceMap[code].attempts += 1
    modulePerformanceMap[code].totalScore += attempt.score || 0
    modulePerformanceMap[code].scoreTrend.push(attempt.score || 0)
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
          <div className="mx-auto w-full max-w-[1080px] space-y-6">
            <div className={ui.cardFull}>
              <p className={ui.textLabel}>Overview</p>
              <div className="mt-3 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                <div className={ui.cardFull}><p className={ui.textLabel}>Total quizzes</p><p className="mt-2 text-2xl font-semibold">{accessibleQuizTotal}</p></div>
                <div className={ui.cardFull}><p className={ui.textLabel}>Average score</p><p className="mt-2 text-2xl font-semibold">{averageScore}%</p></div>
                <div className={ui.cardFull}><p className={ui.textLabel}>Analogy views</p><p className="mt-2 text-2xl font-semibold">{analogyViews}</p></div>
                <div className={ui.cardFull}><p className={ui.textLabel}>To do</p><p className="mt-2 text-2xl font-semibold">{stateTotals.TO_DO}</p></div>
                <div className={ui.cardFull}><p className={ui.textLabel}>In progress</p><p className="mt-2 text-2xl font-semibold">{stateTotals.IN_PROGRESS}</p></div>
                <div className={ui.cardFull}><p className={ui.textLabel}>Completed</p><p className="mt-2 text-2xl font-semibold">{stateTotals.COMPLETED}</p></div>
              </div>
            </div>

            <div className={ui.cardFull}>
              <div className="mb-4">
                <h2 className={ui.cardHeader}>Quiz progress pipeline</h2>
              </div>
              <StackedPipelineBar
                toDo={stateTotals.TO_DO}
                inProgress={stateTotals.IN_PROGRESS}
                completed={stateTotals.COMPLETED}
              />
            </div>

            <div className={ui.cardFull}>
              <div className="mb-4">
                <h2 className={ui.cardHeader}>Module performance</h2>
              </div>
              <div className="space-y-3 text-sm">
                {modulePerformance.map((item) => (
                  <div key={item.code} className={ui.cardList}>
                    <p className="font-medium">{item.code}</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <CompletedMiniBar
                        completed={item.completed}
                        total={item.toDo + item.inProgress + item.completed}
                      />
                      <ScoreTrendSparkline scores={item.scoreTrend} />
                    </div>
                    <p className="mt-2 text-sm text-slate-200">
                      Average submitted score: <span className="font-semibold text-emerald-300">{item.attempts ? Math.round(item.totalScore / item.attempts) : 0}%</span>
                    </p>
                  </div>
                ))}
                {modulePerformance.length === 0 ? <p className={ui.textSmall}>No quiz attempts submitted yet.</p> : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
