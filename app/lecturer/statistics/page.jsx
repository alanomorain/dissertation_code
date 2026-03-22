import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import * as ui from "../../styles/ui"

function parseRange(searchParams) {
  const range = String(searchParams?.range || "30d")
  const now = new Date()
  if (range === "7d") return { range, from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
  if (range === "90d") return { range, from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) }
  if (range === "all") return { range, from: null }
  return { range: "30d", from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
}

function dateRangeLabel(range) {
  if (range === "7d") return "Last 7 days"
  if (range === "90d") return "Last 90 days"
  if (range === "all") return "All time"
  return "Last 30 days"
}

function analogyBuckets(analogySets, fromDate) {
  return analogySets.reduce(
    (acc, set) => {
      const inRangeInteractions = fromDate
        ? set.interactions.filter((interaction) => new Date(interaction.createdAt) >= fromDate)
        : set.interactions
      const isApprovedReady = set.status === "ready" && set.reviewStatus === "APPROVED"

      if (!isApprovedReady) {
        acc.draft += 1
      } else if (inRangeInteractions.length > 0) {
        acc.active += 1
      } else {
        acc.upcoming += 1
      }
      return acc
    },
    { active: 0, draft: 0, upcoming: 0 },
  )
}

function quizRevisitCount(submittedAttempts) {
  const perStudent = submittedAttempts.reduce((acc, attempt) => {
    const key = `${attempt.quizId}:${attempt.studentId}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  return Object.values(perStudent).reduce((total, count) => total + Math.max(0, count - 1), 0)
}

function createLectureRows(module, fromDate) {
  const rows = module.lectures.map((lecture) => {
    const lectureAttempts = lecture.quizzes.flatMap((quiz) => quiz.attempts)
    const participants = new Set(lectureAttempts.map((attempt) => attempt.studentId)).size
    const avgScore = lectureAttempts.length
      ? Math.round(lectureAttempts.reduce((total, attempt) => total + (attempt.score || 0), 0) / lectureAttempts.length)
      : 0
    const revisits = quizRevisitCount(lectureAttempts)
    const interactions = lecture.analogySets.flatMap((set) => {
      const scopedInteractions = fromDate
        ? set.interactions.filter((interaction) => new Date(interaction.createdAt) >= fromDate)
        : set.interactions
      return scopedInteractions
    })

    return {
      id: lecture.id,
      title: lecture.title,
      analogySetCount: lecture.analogySets.length,
      interactionCount: interactions.length,
      quizCount: lecture.quizzes.length,
      completions: lectureAttempts.length,
      participants,
      avgScore,
      revisits,
    }
  })

  const unassignedQuizzes = module.quizzes.filter((quiz) => !quiz.lectureId)
  if (unassignedQuizzes.length > 0) {
    const attempts = unassignedQuizzes.flatMap((quiz) => quiz.attempts)
    rows.push({
      id: "unassigned",
      title: "Unassigned quizzes",
      analogySetCount: 0,
      interactionCount: 0,
      quizCount: unassignedQuizzes.length,
      completions: attempts.length,
      participants: new Set(attempts.map((attempt) => attempt.studentId)).size,
      avgScore: attempts.length
        ? Math.round(attempts.reduce((total, attempt) => total + (attempt.score || 0), 0) / attempts.length)
        : 0,
      revisits: quizRevisitCount(attempts),
    })
  }

  return rows
}

export default async function LecturerStatisticsPage({ searchParams }) {
  const lecturerUser = await getCurrentUser("LECTURER", { id: true })
  if (!lecturerUser) redirect("/lecturer/login")

  const resolvedSearchParams = await searchParams
  const { range, from } = parseRange(resolvedSearchParams)

  const modules = await prisma.module.findMany({
    where: { lecturerId: lecturerUser.id },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        select: { userId: true },
      },
      analogySets: {
        select: {
          id: true,
          status: true,
          reviewStatus: true,
          interactions: {
            select: { createdAt: true },
          },
        },
      },
      quizzes: {
        include: {
          attempts: {
            where: {
              status: "SUBMITTED",
              ...(from ? { submittedAt: { gte: from } } : {}),
            },
            select: { score: true, studentId: true, quizId: true },
          },
        },
      },
      lectures: {
        include: {
          analogySets: {
            select: {
              id: true,
              interactions: {
                select: { createdAt: true },
              },
            },
          },
          quizzes: {
            include: {
              attempts: {
                where: {
                  status: "SUBMITTED",
                  ...(from ? { submittedAt: { gte: from } } : {}),
                },
                select: { score: true, studentId: true, quizId: true },
              },
            },
          },
        },
      },
    },
    orderBy: { code: "asc" },
  })

  const moduleCards = modules.map((module) => {
    const submittedAttempts = module.quizzes.flatMap((quiz) => quiz.attempts)
    const participants = new Set(submittedAttempts.map((attempt) => attempt.studentId)).size
    const activeStudents = module.enrollments.length
    const participationRate = activeStudents
      ? Math.round((participants / activeStudents) * 100)
      : 0
    const avgQuizScore = submittedAttempts.length
      ? Math.round(
          submittedAttempts.reduce((total, attempt) => total + (attempt.score || 0), 0) / submittedAttempts.length,
        )
      : 0
    const analogyStats = analogyBuckets(module.analogySets, from)
    const completions = submittedAttempts.length
    const revisits = quizRevisitCount(submittedAttempts)
    const lectureRows = createLectureRows(module, from)
    const lectureCompletions = lectureRows.reduce((total, lecture) => total + lecture.completions, 0)
    const lectureAvgScore = lectureCompletions
      ? Math.round(
          lectureRows.reduce((total, lecture) => total + (lecture.avgScore * lecture.completions), 0) / lectureCompletions,
        )
      : 0

    return {
      code: module.code,
      name: module.name,
      lectureInstances: module.lectures.length,
      analogyStats,
      avgQuizScore,
      participationRate,
      participants,
      activeStudents,
      completions,
      revisits,
      lectureCompletions,
      lectureAvgScore,
      lecturesWithQuizActivity: lectureRows.filter((lecture) => lecture.completions > 0).length,
    }
  })

  const totalCompletions = moduleCards.reduce((total, module) => total + module.completions, 0)
  const totalRevisits = moduleCards.reduce((total, module) => total + module.revisits, 0)

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Lecturer statistics</h1>
            <p className={ui.textSmall}>Module-first analytics with participation, outcomes, and engagement.</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/lecturer" className={ui.buttonSecondary}>Back to dashboard</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={ui.textLabel}>Date range: {dateRangeLabel(range)}</p>
              <div className="flex items-center gap-2 text-xs">
                <Link href={`/lecturer/statistics?range=7d`} className={range === "7d" ? ui.buttonPrimary : ui.buttonSecondary}>7d</Link>
                <Link href={`/lecturer/statistics?range=30d`} className={range === "30d" ? ui.buttonPrimary : ui.buttonSecondary}>30d</Link>
                <Link href={`/lecturer/statistics?range=90d`} className={range === "90d" ? ui.buttonPrimary : ui.buttonSecondary}>90d</Link>
                <Link href={`/lecturer/statistics?range=all`} className={range === "all" ? ui.buttonPrimary : ui.buttonSecondary}>All</Link>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm">
              <div className={`${ui.card} p-4`}>
                <p className={ui.textLabel}>Modules</p>
                <p className="mt-1 text-2xl font-semibold">{moduleCards.length}</p>
              </div>
              <div className={`${ui.card} p-4`}>
                <p className={ui.textLabel}>Quiz completions</p>
                <p className="mt-1 text-2xl font-semibold">{totalCompletions}</p>
              </div>
              <div className={`${ui.card} p-4`}>
                <p className={ui.textLabel}>Quiz revisits</p>
                <p className="mt-1 text-2xl font-semibold">{totalRevisits}</p>
              </div>
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Module breakdown</h2>
            <div className="space-y-3 text-sm">
              {moduleCards.map((module) => (
                <Link
                  key={module.code}
                  href={`/lecturer/statistics/${encodeURIComponent(module.code)}?range=${range}`}
                  className={`${ui.cardList} block hover:border-indigo-400 transition`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-100">{module.code} · {module.name}</p>
                      <p className="text-xs text-slate-400">
                        Lecture instances: {module.lectureInstances} · Analogies (active/draft/upcoming): {module.analogyStats.active}/{module.analogyStats.draft}/{module.analogyStats.upcoming}
                      </p>
                      <p className="text-xs text-slate-400">
                        Avg quiz score: {module.avgQuizScore}% · Participation: {module.participationRate}% ({module.participants}/{module.activeStudents})
                      </p>
                      <p className="text-xs text-slate-400">
                        Quiz completions: {module.completions} · Revisits: {module.revisits} · Active lectures: {module.lecturesWithQuizActivity}
                      </p>
                      <p className="text-xs text-slate-400">
                        Lecture-scoped avg score: {module.lectureAvgScore}% · Lecture-scoped completions: {module.lectureCompletions}
                      </p>
                    </div>
                    <span className={ui.buttonSmall}>Open module stats</span>
                  </div>
                </Link>
              ))}
              {moduleCards.length === 0 ? <p className={ui.textSmall}>No modules available yet.</p> : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
