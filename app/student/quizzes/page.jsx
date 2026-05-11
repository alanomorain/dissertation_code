import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import {
  createStudentAttemptStats,
  getStudentQuizProgressState,
} from "../../lib/quizState"
import { getModuleDisplayName } from "../../lib/moduleDisplay"
import * as ui from "../../styles/ui"
import StudentPageHeader from "../components/StudentPageHeader"
import StudentModuleQuizCard from "./components/StudentModuleQuizCard"

const STATUS_FILTERS = [
  { key: "TO_DO", label: "To do" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "COMPLETED", label: "Completed" },
  { key: "UPCOMING", label: "Upcoming" },
  { key: "CLOSED", label: "Closed" },
]

function badgeForState(state, quiz, nowTs) {
  const dueTs = quiz.dueAt ? new Date(quiz.dueAt).getTime() : null
  if (state === "UPCOMING") return "Upcoming"
  if (state === "CLOSED") return "Closed"
  if (state === "COMPLETED" && dueTs && dueTs < nowTs) return "Closed"
  if (state === "COMPLETED") return "Completed"
  if (state === "IN_PROGRESS") return "In progress"
  return "To do"
}

export default async function StudentQuizzesPage({ searchParams }) {
  const studentUser = await getCurrentUser("STUDENT", { id: true, email: true })
  if (!studentUser) redirect("/student/login")
  const resolvedSearchParams = await searchParams
  const moduleCodeFilter = String(resolvedSearchParams?.module || "").trim().toUpperCase()
  const statusParam = String(resolvedSearchParams?.status || "").trim().toUpperCase()
  const statusFilter = STATUS_FILTERS.some((filter) => filter.key === statusParam) ? statusParam : ""

  const quizHref = ({ module = moduleCodeFilter, status = statusFilter } = {}) => {
    const params = new URLSearchParams()
    if (module) params.set("module", module)
    if (status) params.set("status", status)
    const query = params.toString()
    return query ? `/student/quizzes?${query}` : "/student/quizzes"
  }

  const nowTs = new Date().getTime()
  const [modules, quizzes] = await Promise.all([
    prisma.module.findMany({
      where: {
        enrollments: {
          some: { userId: studentUser.id, status: "ACTIVE" },
        },
      },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    }),
    prisma.quiz.findMany({
      where: {
        status: "PUBLISHED",
        module: {
          enrollments: {
              some: { userId: studentUser.id, status: "ACTIVE" },
            },
            ...(moduleCodeFilter ? { code: moduleCodeFilter } : {}),
          },
        },
      include: { module: { select: { code: true, name: true } } },
      orderBy: [{ module: { code: "asc" } }, { dueAt: "asc" }, { createdAt: "desc" }],
    }),
  ])

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
          CLOSED: 0,
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
      releaseText: quiz.publishedAt ? new Date(quiz.publishedAt).toLocaleDateString() : "Available now",
      dueText: quiz.dueAt ? new Date(quiz.dueAt).toLocaleDateString() : "No due date",
      dueAtTs: quiz.dueAt ? new Date(quiz.dueAt).getTime() : null,
    })

    return acc
  }, {})

  const moduleGroups = Object.values(moduleMap).map((group) => ({
    ...group,
    quizzes: group.quizzes.sort((a, b) => {
      const priority = { TO_DO: 0, IN_PROGRESS: 1, COMPLETED: 2, CLOSED: 3, UPCOMING: 4 }
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
      acc.CLOSED += moduleGroup.counts.CLOSED
      return acc
    },
    { TO_DO: 0, IN_PROGRESS: 0, COMPLETED: 0, UPCOMING: 0, CLOSED: 0 },
  )

  const filteredModuleGroups = statusFilter
    ? moduleGroups
        .map((group) => ({
          ...group,
          quizzes: group.quizzes.filter((quiz) => quiz.state === statusFilter),
        }))
        .filter((group) => group.quizzes.length > 0)
    : moduleGroups

  return (
    <main className={ui.page}>
      <StudentPageHeader
        label="Student · Quizzes"
        title="Quiz Dashboard"
        subtitle="Track upcoming, active, completed, and closed quizzes."
        actions={<Link href="/student" className={ui.buttonSecondary}>Student Dashboard</Link>}
      />

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href={quizHref({ module: "" })}
                className={!moduleCodeFilter ? ui.buttonPrimary : ui.buttonSecondary}
              >
                All modules
              </Link>
              {modules.map((module) => (
                <Link
                  key={module.id}
                  href={quizHref({ module: module.code })}
                  className={moduleCodeFilter === module.code ? ui.buttonPrimary : ui.buttonSecondary}
                >
                  {getModuleDisplayName(module)}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STATUS_FILTERS.map((filter) => {
              const active = statusFilter === filter.key
              return (
                <Link
                  key={filter.key}
                  href={quizHref({ status: active ? "" : filter.key })}
                  aria-current={active ? "page" : undefined}
                  className={`${ui.card} block p-4 transition hover:border-teal-500 hover:bg-teal-50 ${
                    active ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500/20" : ""
                  }`}
                >
                  <p className={ui.textLabel}>{filter.label}</p>
                  <p className="text-2xl font-semibold">{statusTotals[filter.key]}</p>
                </Link>
              )
            })}
          </div>

          <div className="w-full space-y-6">
            {filteredModuleGroups.length === 0 ? (
              <div className={ui.cardFull}>
                <h2 className={ui.cardHeader}>Quiz library</h2>
                <p className={ui.textSmall}>
                  {statusFilter
                    ? `No ${STATUS_FILTERS.find((filter) => filter.key === statusFilter)?.label.toLowerCase()} quizzes for this selection.`
                    : "No published quizzes for your active modules right now."}
                </p>
              </div>
            ) : (
              filteredModuleGroups.map((group) => <StudentModuleQuizCard key={group.moduleCode} moduleGroup={group} />)
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
