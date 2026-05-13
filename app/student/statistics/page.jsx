import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import { getModuleDisplayName } from "../../lib/moduleDisplay"
import * as ui from "../../styles/ui"
import StudentPageHeader from "../components/StudentPageHeader"

function average(total, count) {
  return count ? Math.round(total / count) : 0
}

function percent(part, total) {
  return total ? Math.round((part / total) * 100) : 0
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
      <h2 className={ui.cardHeader}>Average Performance</h2>
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
                style={{ width: `${Math.max(row.value > 0 ? 4 : 0, percent(row.value, maxScore))}%` }}
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

function AttemptComparisonChart({ rows }) {
  return (
    <div className={ui.cardFull}>
      <h2 className={ui.cardHeader}>1st vs 2nd Attempts</h2>
      {rows.length === 0 ? (
        <EmptyVisual>No submitted quiz attempts yet.</EmptyVisual>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.id}>
              <div className="mb-2 flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-stone-950">{row.label}</p>
                  <p className="text-xs text-stone-600">{row.helper}</p>
                </div>
                <p className="shrink-0 text-xs text-stone-600">
                  {row.secondScore === null ? "2nd: N/A" : `Change: ${row.secondScore - row.firstScore >= 0 ? "+" : ""}${row.secondScore - row.firstScore}%`}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <AttemptBar label="1st" value={row.firstScore} color="bg-stone-500" />
                <AttemptBar label="2nd" value={row.secondScore} color="bg-teal-600" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AttemptBar({ label, value, color }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-stone-600">
        <span>{label} attempt</span>
        <span>{value === null ? "N/A" : `${value}%`}</span>
      </div>
      <div className="h-4 rounded-full bg-stone-100">
        {value === null ? (
          <div className="h-4 rounded-full border border-dashed border-stone-300 bg-stone-50" />
        ) : (
          <div className={`h-4 rounded-full ${color}`} style={{ width: `${Math.max(value > 0 ? 3 : 0, value)}%` }} />
        )}
      </div>
    </div>
  )
}

function buildModuleStats(module) {
  const submittedAttempts = module.quizzes.flatMap((quiz) => quiz.attempts.filter((attempt) => attempt.status === "SUBMITTED"))
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
  const analogyPageViews = module.analogySets.reduce((total, set) => total + set.interactions.length, 0)
  const quizAnalogyViews = quizInteractions.filter((interaction) => interaction.type === "ANALOGY_VIEW").length

  const quizRows = module.quizzes.map((quiz) => {
    const attempts = quiz.attempts
      .filter((attempt) => attempt.status === "SUBMITTED")
      .sort((a, b) => {
        const aTs = new Date(a.submittedAt || a.createdAt || 0).getTime()
        const bTs = new Date(b.submittedAt || b.createdAt || 0).getTime()
        return aTs - bTs
      })
    const totalScore = attempts.reduce((total, attempt) => total + (attempt.score || 0), 0)

    return {
      id: quiz.id,
      label: quiz.title,
      helper: getModuleDisplayName(module),
      value: average(totalScore, attempts.length),
      completions: attempts.length,
      firstScore: attempts[0]?.score ?? null,
      secondScore: attempts[1]?.score ?? null,
    }
  })

  return {
    id: module.id,
    code: module.code,
    name: module.name,
    quizCount: module.quizzes.length,
    attemptedQuizCount: quizRows.filter((quiz) => quiz.completions > 0).length,
    submittedAttempts,
    responses,
    noAnalogyResponses,
    analogyPageViews,
    quizAnalogyViews,
    totalAnalogyViews: analogyPageViews + quizAnalogyViews,
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

export default async function StudentStatisticsPage({ searchParams }) {
  const studentUser = await getCurrentUser("STUDENT", { id: true, email: true })
  if (!studentUser) redirect("/student/login")

  const resolvedSearchParams = await searchParams
  const moduleCodeFilter = String(resolvedSearchParams?.module || "").trim().toUpperCase()

  const modules = await prisma.module.findMany({
    where: {
      enrollments: {
        some: { userId: studentUser.id, status: "ACTIVE" },
      },
    },
    include: {
      analogySets: {
        select: {
          id: true,
          interactions: {
            where: { userId: studentUser.id },
            select: { id: true },
          },
        },
      },
      quizzes: {
        where: { status: "PUBLISHED" },
        include: {
          attempts: {
            where: { studentId: studentUser.id },
            select: {
              id: true,
              score: true,
              status: true,
              submittedAt: true,
              createdAt: true,
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
                where: { studentId: studentUser.id },
                select: {
                  attemptId: true,
                  questionId: true,
                  type: true,
                },
              },
            },
          },
        },
        orderBy: [{ createdAt: "asc" }, { title: "asc" }],
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
  const totalQuizzes = moduleStats.reduce((total, module) => total + module.quizCount, 0)
  const attemptedQuizzes = moduleStats.reduce((total, module) => total + module.attemptedQuizCount, 0)
  const totalCompletions = allAttempts.length
  const totalResponses = moduleStats.reduce((total, module) => total + module.responses.length, 0)
  const totalNoAnalogyResponses = moduleStats.reduce((total, module) => total + module.noAnalogyResponses, 0)
  const analogyPageViews = moduleStats.reduce((total, module) => total + module.analogyPageViews, 0)
  const quizAnalogyViews = moduleStats.reduce((total, module) => total + module.quizAnalogyViews, 0)
  const totalAnalogyViews = analogyPageViews + quizAnalogyViews
  const averageScore = average(
    allAttempts.reduce((total, attempt) => total + (attempt.score || 0), 0),
    allAttempts.length,
  )
  const bestScore = allAttempts.length
    ? Math.max(...allAttempts.map((attempt) => attempt.score || 0))
    : 0

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

  const quizRows = moduleStats
    .flatMap((module) => module.quizRows)
    .filter((quiz) => quiz.completions > 0)
    .sort((a, b) => a.helper.localeCompare(b.helper) || a.label.localeCompare(b.label))
  const attemptComparisonRows = quizRows
    .filter((quiz) => quiz.firstScore !== null)
    .map((quiz) => ({
      id: quiz.id,
      label: quiz.label,
      helper: quiz.helper,
      firstScore: quiz.firstScore,
      secondScore: quiz.secondScore,
    }))
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
      <StudentPageHeader
        label="Student · Statistics"
        title="Stats Dashboard"
        actions={<Link href="/student" className={ui.buttonSecondary}>Student Dashboard</Link>}
      />

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link href="/student/statistics" className={!moduleCodeFilter ? ui.buttonPrimary : ui.buttonSecondary}>
                All Modules
              </Link>
              {modules.map((module) => (
                <Link
                  key={module.id}
                  href={`/student/statistics?module=${encodeURIComponent(module.code)}`}
                  className={moduleCodeFilter === module.code ? ui.buttonPrimary : ui.buttonSecondary}
                >
                  {getModuleDisplayName(module)}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6 text-sm">
            <MetricCard label="Quiz completions" value={totalCompletions} />
            <MetricCard label="Average score" value={`${averageScore}%`} />
            <MetricCard label="Analogy views" value={totalAnalogyViews} helper={`${analogyPageViews} page · ${quizAnalogyViews} quiz`} />
            <MetricCard label="Questions without analogies" value={`${percent(totalNoAnalogyResponses, totalResponses)}%`} helper={`${totalNoAnalogyResponses}/${totalResponses} answered`} />
            <MetricCard label="Quizzes attempted" value={`${percent(attemptedQuizzes, totalQuizzes)}%`} helper={`${attemptedQuizzes}/${totalQuizzes} submitted`} />
            <MetricCard label="Best score" value={`${bestScore}%`} helper={`${attemptedQuizzes} completed quiz${attemptedQuizzes === 1 ? "" : "zes"}`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PerformanceComparison rows={performanceRows} />
            <AttemptComparisonChart rows={attemptComparisonRows} />
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
