import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import { getModuleDisplayName } from "../../lib/moduleDisplay"
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
      title: "Unassigned Quizzes",
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
            select: { id: true, score: true, studentId: true, quizId: true },
          },
          questions: {
            select: {
              interactions: {
                where: from ? { createdAt: { gte: from } } : {},
                select: { attemptId: true, type: true },
              },
            },
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
    const quizMediaInteractions = module.quizzes.flatMap((quiz) =>
      quiz.questions.flatMap((question) => question.interactions),
    )
    const mediaByAttempt = quizMediaInteractions.reduce((acc, interaction) => {
      if (!acc[interaction.attemptId]) acc[interaction.attemptId] = { analogy: 0, video: 0 }
      if (interaction.type === "ANALOGY_VIEW") acc[interaction.attemptId].analogy += 1
      if (interaction.type === "VIDEO_VIEW") acc[interaction.attemptId].video += 1
      return acc
    }, {})
    const scoreGroups = submittedAttempts.reduce(
      (acc, attempt) => {
        const media = mediaByAttempt[attempt.id] || { analogy: 0, video: 0 }
        const key = media.video > 0 ? "withVideo" : media.analogy > 0 ? "analogyOnly" : "noMedia"
        acc[key].count += 1
        acc[key].total += attempt.score || 0
        return acc
      },
      {
        noMedia: { count: 0, total: 0 },
        analogyOnly: { count: 0, total: 0 },
        withVideo: { count: 0, total: 0 },
      },
    )
    const averageForGroup = (group) => (group.count ? Math.round(group.total / group.count) : 0)
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
      analogyQuestionViews: quizMediaInteractions.filter((interaction) => interaction.type === "ANALOGY_VIEW").length,
      videoViews: quizMediaInteractions.filter((interaction) => interaction.type === "VIDEO_VIEW").length,
      noMediaScore: averageForGroup(scoreGroups.noMedia),
      analogyOnlyScore: averageForGroup(scoreGroups.analogyOnly),
      withVideoScore: averageForGroup(scoreGroups.withVideo),
      lectureCompletions,
      lectureAvgScore,
      lecturesWithQuizActivity: lectureRows.filter((lecture) => lecture.completions > 0).length,
    }
  })

  const totalCompletions = moduleCards.reduce((total, module) => total + module.completions, 0)
  const totalRevisits = moduleCards.reduce((total, module) => total + module.revisits, 0)
  const totalAnalogyQuestionViews = moduleCards.reduce((total, module) => total + module.analogyQuestionViews, 0)
  const totalVideoViews = moduleCards.reduce((total, module) => total + module.videoViews, 0)

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <p className={ui.textLabel}>Lecturer · Statistics</p>
            <h1 className="text-lg font-semibold">Stats Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/lecturer" className={ui.buttonSecondary}>Lecturer Dashboard</Link>
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

            <div className="mt-4 grid gap-4 md:grid-cols-5 text-sm">
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
              <div className={`${ui.card} p-4`}>
                <p className={ui.textLabel}>Analogy views</p>
                <p className="mt-1 text-2xl font-semibold">{totalAnalogyQuestionViews}</p>
              </div>
              <div className={`${ui.card} p-4`}>
                <p className={ui.textLabel}>Video views</p>
                <p className="mt-1 text-2xl font-semibold">{totalVideoViews}</p>
              </div>
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Module Breakdown</h2>
            <div className="space-y-3 text-sm">
              {moduleCards.map((module) => (
                <Link
                  key={module.code}
                  href={`/lecturer/statistics/${encodeURIComponent(module.code)}?range=${range}`}
                  className={`${ui.cardList} block hover:border-teal-500 transition`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-950">{getModuleDisplayName(module)}</p>
                      <p className="text-xs text-stone-600">
                        Lecture instances: {module.lectureInstances} · Analogies (active/draft/upcoming): {module.analogyStats.active}/{module.analogyStats.draft}/{module.analogyStats.upcoming}
                      </p>
                      <p className="text-xs text-stone-600">
                        Avg quiz score: {module.avgQuizScore}% · Participation: {module.participationRate}% ({module.participants}/{module.activeStudents})
                      </p>
                      <p className="text-xs text-stone-600">
                        Quiz completions: {module.completions} · Revisits: {module.revisits} · Active lectures: {module.lecturesWithQuizActivity}
                      </p>
                      <p className="text-xs text-stone-600">
                        Quiz analogy views: {module.analogyQuestionViews} · Video views: {module.videoViews}
                      </p>
                      <p className="text-xs text-stone-600">
                        Avg score no media/analogy/video: {module.noMediaScore}%/{module.analogyOnlyScore}%/{module.withVideoScore}%
                      </p>
                      <p className="text-xs text-stone-600">
                        Lecture-scoped avg score: {module.lectureAvgScore}% · Lecture-scoped completions: {module.lectureCompletions}
                      </p>
                    </div>
                    <span className={ui.buttonSmall}>Open Module Stats</span>
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
