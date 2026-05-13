import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import { getModuleDisplayName } from "../../lib/moduleDisplay"
import * as ui from "../../styles/ui"

function average(total, count) {
  return count ? Math.round(total / count) : 0
}

function percent(part, total) {
  return total ? Math.round((part / total) * 100) : 0
}

function dateKey(dateValue) {
  if (!dateValue) return "Unknown"
  return new Date(dateValue).toISOString().slice(0, 10)
}

function dateLabel(key) {
  if (key === "Unknown") return key
  return new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  })
}

function collectAttemptMedia(interactions) {
  return interactions.reduce((acc, interaction) => {
    if (!acc[interaction.attemptId]) acc[interaction.attemptId] = { analogy: 0, video: 0 }
    if (interaction.type === "ANALOGY_VIEW") acc[interaction.attemptId].analogy += 1
    if (interaction.type === "VIDEO_VIEW") acc[interaction.attemptId].video += 1
    return acc
  }, {})
}

function MetricCard({ label, value, helper }) {
  return (
    <div className={`${ui.card} p-4`}>
      <p className={ui.textLabel}>{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {helper ? <p className="mt-1 text-xs text-stone-600">{helper}</p> : null}
    </div>
  )
}

function EmptyVisual({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center text-sm text-stone-600">
      {children}
    </div>
  )
}

function PerformanceComparison({ rows }) {
  const maxScore = Math.max(100, ...rows.map((row) => row.value))

  return (
    <div className={ui.cardFull}>
      <h2 className={ui.cardHeader}>Average Student Performance</h2>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <p className="font-medium text-stone-950">{row.label}</p>
              <p className="text-sm font-semibold text-stone-950">{row.value}%</p>
            </div>
            <div className="h-8 rounded-lg bg-stone-100">
              <div
                className={`flex h-8 items-center rounded-lg px-3 text-xs font-medium text-white ${row.color}`}
                style={{ width: `${Math.max(4, percent(row.value, maxScore))}%` }}
              >
                {row.count} attempt{row.count === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HorizontalBarChart({ title, rows, emptyText }) {
  const maxValue = Math.max(100, ...rows.map((row) => row.value))

  return (
    <div className={ui.cardFull}>
      <h2 className={ui.cardHeader}>{title}</h2>
      {rows.length === 0 ? (
        <EmptyVisual>{emptyText}</EmptyVisual>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id}>
              <div className="mb-1 flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-stone-950">{row.label}</p>
                  {row.helper ? <p className="text-xs text-stone-600">{row.helper}</p> : null}
                </div>
                <p className="shrink-0 text-sm font-semibold text-stone-950">{row.value}%</p>
              </div>
              <div className="h-4 rounded-full bg-stone-100">
                <div
                  className="h-4 rounded-full bg-teal-600"
                  style={{ width: `${Math.max(row.value > 0 ? 3 : 0, percent(row.value, maxValue))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ParticipationTrend({ rows }) {
  if (rows.length === 0) {
    return (
      <div className={ui.cardFull}>
        <h2 className={ui.cardHeader}>Average Participation Over Time</h2>
        <EmptyVisual>No submitted quiz attempts yet.</EmptyVisual>
      </div>
    )
  }

  if (rows.length === 1) {
    return (
      <div className={ui.cardFull}>
        <h2 className={ui.cardHeader}>Average Participation Over Time</h2>
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm font-medium text-stone-950">{rows[0].rate}% participation</p>
          <p className="text-xs text-stone-600">
            {dateLabel(rows[0].date)} · {rows[0].participants} participating student{rows[0].participants === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    )
  }

  const width = 720
  const height = 190
  const paddingX = 34
  const paddingY = 22
  const chartWidth = width - paddingX * 2
  const chartHeight = height - paddingY * 2
  const points = rows.map((row, index) => {
    const x = paddingX + (index / (rows.length - 1)) * chartWidth
    const y = paddingY + chartHeight - (row.rate / 100) * chartHeight
    return { ...row, x, y }
  })
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ")
  const area = `${paddingX},${height - paddingY} ${polyline} ${width - paddingX},${height - paddingY}`

  return (
    <div className={ui.cardFull}>
      <h2 className={ui.cardHeader}>Average Participation Over Time</h2>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full" role="img" aria-label="Participation trend">
        <polygon points={area} fill="#ccfbf1" opacity="0.8" />
        <polyline fill="none" stroke="#0f766e" strokeWidth="4" points={polyline} strokeLinecap="round" strokeLinejoin="round" />
        {[0, 50, 100].map((tick) => {
          const y = paddingY + chartHeight - (tick / 100) * chartHeight
          return (
            <g key={tick}>
              <line x1={paddingX} x2={width - paddingX} y1={y} y2={y} stroke="#e7e5e4" />
              <text x="0" y={y + 4} className="fill-stone-500 text-[11px]">{tick}%</text>
            </g>
          )
        })}
        {points.map((point) => (
          <g key={point.date}>
            <circle cx={point.x} cy={point.y} r="5" fill="#0f766e" />
            <text x={point.x} y={height - 4} textAnchor="middle" className="fill-stone-500 text-[11px]">
              {dateLabel(point.date)}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-600">
        {rows.map((row) => (
          <span key={row.date} className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1">
            {dateLabel(row.date)}: {row.rate}%
          </span>
        ))}
      </div>
    </div>
  )
}

function buildModuleStats(module) {
  const submittedAttempts = module.quizzes.flatMap((quiz) => quiz.attempts)
  const quizInteractions = module.quizzes.flatMap((quiz) =>
    quiz.questions.flatMap((question) => question.interactions),
  )
  const mediaByAttempt = collectAttemptMedia(quizInteractions)
  const questionAnalogyViews = new Set(
    quizInteractions
      .filter((interaction) => interaction.type === "ANALOGY_VIEW")
      .map((interaction) => `${interaction.attemptId}:${interaction.questionId}`),
  )
  const responses = submittedAttempts.flatMap((attempt) =>
    attempt.responses.map((response) => ({
      attemptId: attempt.id,
      questionId: response.questionId,
    })),
  )
  const noAnalogyResponses = responses.filter(
    (response) => !questionAnalogyViews.has(`${response.attemptId}:${response.questionId}`),
  ).length

  const scoreGroups = submittedAttempts.reduce(
    (acc, attempt) => {
      const media = mediaByAttempt[attempt.id] || { analogy: 0 }
      const key = media.analogy > 0 ? "withAnalogy" : "withoutAnalogy"
      acc[key].count += 1
      acc[key].total += attempt.score || 0
      return acc
    },
    {
      withAnalogy: { count: 0, total: 0 },
      withoutAnalogy: { count: 0, total: 0 },
    },
  )
  const activeStudentIds = new Set(module.enrollments.map((enrollment) => enrollment.userId))
  const participantIds = new Set(submittedAttempts.map((attempt) => attempt.studentId))
  const totalAnalogyViews = module.analogySets.reduce((total, set) => total + set.interactions.length, 0)

  const quizRows = module.quizzes.map((quiz) => {
    const attempts = quiz.attempts
    return {
      id: quiz.id,
      label: quiz.title,
      helper: getModuleDisplayName(module),
      value: average(
        attempts.reduce((total, attempt) => total + (attempt.score || 0), 0),
        attempts.length,
      ),
      completions: attempts.length,
    }
  })

  return {
    id: module.id,
    code: module.code,
    name: module.name,
    activeStudentIds,
    participantIds,
    submittedAttempts,
    responses,
    noAnalogyResponses,
    totalAnalogyViews,
    quizRows,
    avgScore: average(
      submittedAttempts.reduce((total, attempt) => total + (attempt.score || 0), 0),
      submittedAttempts.length,
    ),
    withAnalogyAvg: average(scoreGroups.withAnalogy.total, scoreGroups.withAnalogy.count),
    withAnalogyCount: scoreGroups.withAnalogy.count,
    withoutAnalogyAvg: average(scoreGroups.withoutAnalogy.total, scoreGroups.withoutAnalogy.count),
    withoutAnalogyCount: scoreGroups.withoutAnalogy.count,
  }
}

export default async function LecturerStatisticsPage({ searchParams }) {
  const lecturerUser = await getCurrentUser("LECTURER", { id: true })
  if (!lecturerUser) redirect("/lecturer/login")

  const resolvedSearchParams = await searchParams
  const moduleCodeFilter = String(resolvedSearchParams?.module || "").trim().toUpperCase()

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
          interactions: {
            select: { id: true },
          },
        },
      },
      quizzes: {
        include: {
          attempts: {
            where: { status: "SUBMITTED" },
            select: {
              id: true,
              score: true,
              studentId: true,
              submittedAt: true,
              responses: {
                select: {
                  questionId: true,
                },
              },
            },
          },
          questions: {
            select: {
              interactions: {
                select: {
                  attemptId: true,
                  questionId: true,
                  type: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { code: "asc" },
  })

  const selectedModule = moduleCodeFilter
    ? modules.find((module) => module.code === moduleCodeFilter)
    : null
  const scopedModules = moduleCodeFilter ? (selectedModule ? [selectedModule] : []) : modules
  const moduleStats = scopedModules.map(buildModuleStats)
  const allAttempts = moduleStats.flatMap((module) => module.submittedAttempts)
  const activeStudentIds = new Set(moduleStats.flatMap((module) => [...module.activeStudentIds]))
  const participantIds = new Set(moduleStats.flatMap((module) => [...module.participantIds]))
  const totalResponses = moduleStats.reduce((total, module) => total + module.responses.length, 0)
  const totalNoAnalogyResponses = moduleStats.reduce((total, module) => total + module.noAnalogyResponses, 0)
  const totalCompletions = allAttempts.length
  const totalAnalogyViews = moduleStats.reduce((total, module) => total + module.totalAnalogyViews, 0)
  const avgQuizScore = average(
    allAttempts.reduce((total, attempt) => total + (attempt.score || 0), 0),
    allAttempts.length,
  )

  const performanceTotals = moduleStats.reduce(
    (acc, module) => {
      acc.withAnalogy.count += module.withAnalogyCount
      acc.withAnalogy.total += module.withAnalogyAvg * module.withAnalogyCount
      acc.withoutAnalogy.count += module.withoutAnalogyCount
      acc.withoutAnalogy.total += module.withoutAnalogyAvg * module.withoutAnalogyCount
      return acc
    },
    {
      withAnalogy: { count: 0, total: 0 },
      withoutAnalogy: { count: 0, total: 0 },
    },
  )
  const performanceRows = [
    {
      label: "Without analogy views",
      value: average(performanceTotals.withoutAnalogy.total, performanceTotals.withoutAnalogy.count),
      count: performanceTotals.withoutAnalogy.count,
      color: "bg-stone-500",
    },
    {
      label: "With analogy views",
      value: average(performanceTotals.withAnalogy.total, performanceTotals.withAnalogy.count),
      count: performanceTotals.withAnalogy.count,
      color: "bg-teal-600",
    },
  ]

  const participationByDate = allAttempts.reduce((acc, attempt) => {
    const key = dateKey(attempt.submittedAt)
    if (!acc[key]) acc[key] = new Set()
    acc[key].add(attempt.studentId)
    return acc
  }, {})
  const participationRows = Object.entries(participationByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, students]) => ({
      date,
      participants: students.size,
      rate: percent(students.size, activeStudentIds.size),
    }))

  const quizRows = moduleStats
    .flatMap((module) => module.quizRows)
    .filter((quiz) => quiz.completions > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
  const moduleRows = moduleStats
    .filter((module) => module.submittedAttempts.length > 0)
    .map((module) => ({
      id: module.id,
      label: getModuleDisplayName(module),
      helper: `${module.submittedAttempts.length} completion${module.submittedAttempts.length === 1 ? "" : "s"}`,
      value: module.avgScore,
    }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))

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
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link href="/lecturer/statistics" className={!moduleCodeFilter ? ui.buttonPrimary : ui.buttonSecondary}>
                All Modules
              </Link>
              {modules.map((module) => (
                <Link
                  key={module.id}
                  href={`/lecturer/statistics?module=${encodeURIComponent(module.code)}`}
                  className={moduleCodeFilter === module.code ? ui.buttonPrimary : ui.buttonSecondary}
                >
                  {getModuleDisplayName(module)}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6 text-sm">
            <MetricCard label="Quiz completions" value={totalCompletions} />
            <MetricCard label="Analogy views" value={totalAnalogyViews} />
            <MetricCard label="Questions without analogies" value={`${percent(totalNoAnalogyResponses, totalResponses)}%`} helper={`${totalNoAnalogyResponses}/${totalResponses} answered`} />
            <MetricCard label="Active students" value={activeStudentIds.size} />
            <MetricCard label="Participation" value={`${percent(participantIds.size, activeStudentIds.size)}%`} helper={`${participantIds.size}/${activeStudentIds.size} students`} />
            <MetricCard label="Average quiz score" value={`${avgQuizScore}%`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PerformanceComparison rows={performanceRows} />
            <ParticipationTrend rows={participationRows} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <HorizontalBarChart
              title="Average Score Per Quiz"
              rows={quizRows}
              emptyText="No submitted quiz attempts yet."
            />
            {!selectedModule ? (
              <HorizontalBarChart
                title="Average Score Per Module"
                rows={moduleRows}
                emptyText="No module scores yet."
              />
            ) : null}
          </div>

          {moduleCodeFilter && !selectedModule ? (
            <div className={ui.cardFull}>
              <p className={ui.textSmall}>No module found for this selection.</p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}
