import Link from "next/link"
import { redirect } from "next/navigation"
import SignOutButton from "../components/SignOutButton"
import { prisma } from "../lib/db"
import { getCurrentUser } from "../lib/currentUser"
import {
  createStudentAttemptStats,
  getStudentQuizProgressState,
} from "../lib/quizState"
import * as ui from "../styles/ui"

const formatDate = (value) => new Date(value).toLocaleDateString()
const formatDateTime = (value) => new Date(value).toLocaleString()

function badgeTextForState(state) {
  if (state === "UPCOMING") return "Upcoming"
  if (state === "CLOSED") return "Closed"
  if (state === "COMPLETED") return "Completed"
  if (state === "IN_PROGRESS") return "In progress"
  return "Available"
}

function QuizLink({ quiz }) {
  const disabled = quiz.state === "UPCOMING" || quiz.state === "CLOSED"
  const content = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold text-stone-950">{quiz.title}</p>
        <p className="text-xs text-stone-600">
          {quiz.moduleCode} · Due {quiz.dueText}
        </p>
        <p className="text-xs text-stone-500">
          Attempts {quiz.submittedAttempts}/{quiz.maxAttempts}
          {quiz.bestScore === null ? "" : ` · Best score ${quiz.bestScore}%`}
        </p>
      </div>
      <span className={quiz.state === "CLOSED" ? ui.badgeFailed : quiz.state === "UPCOMING" ? ui.badgeProcessing : quiz.state === "COMPLETED" ? ui.badgeApproved : ui.badgeReady}>
        {quiz.badgeText}
      </span>
    </div>
  )

  if (disabled) {
    return <div className={ui.cardList}>{content}</div>
  }

  return (
    <Link href={`/student/quizzes/${quiz.id}/start`} className={`${ui.cardList} block transition hover:border-teal-500`}>
      {content}
    </Link>
  )
}

function isDatabaseUnavailableError(error) {
  if (!error) return false

  const message = String(error?.message || "")
  const code = String(error?.code || "")

  return (
    code === "ECONNREFUSED" ||
    message.includes("ECONNREFUSED") ||
    message.includes("Can't reach database server")
  )
}

export default async function StudentDashboard() {
  let studentUser = null
  let activeEnrollments = []
  let recentAnalogies = []
  let quizAttempts = []
  let publishedQuizCount = 0
  let completedQuizCount = 0
  let averageScore = 0
  let upcomingQuizzes = []
  let lectureCount = 0
  let databaseUnavailable = false

  try {
    studentUser = await getCurrentUser("STUDENT", {
      id: true,
      email: true,
      studentNumber: true,
    })

    if (!studentUser) redirect("/student/login")

    activeEnrollments = await prisma.moduleEnrollment.findMany({
      where: { userId: studentUser.id, status: "ACTIVE" },
      include: {
        module: {
          include: {
            _count: {
              select: {
                lectures: true,
                quizzes: true,
              },
            },
          },
        },
      },
      orderBy: { module: { code: "asc" } },
    })

    const moduleIds = activeEnrollments.map((enrollment) => enrollment.moduleId)

    recentAnalogies = moduleIds.length
      ? await prisma.analogySet.findMany({
          where: {
            status: "ready",
            reviewStatus: "APPROVED",
            moduleId: { in: moduleIds },
          },
          include: {
            module: { select: { code: true, name: true } },
            lecture: { select: { title: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 4,
        })
      : []

    lectureCount = moduleIds.length
      ? await prisma.lecture.count({
          where: {
            moduleId: { in: moduleIds },
            analogySets: {
              some: {
                status: "ready",
                reviewStatus: "APPROVED",
              },
            },
          },
        })
      : 0

    quizAttempts = await prisma.quizAttempt.findMany({
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
      select: { score: true, quizId: true, status: true },
    })

    const submittedAttempts = quizAttempts.filter((attempt) => attempt.status === "SUBMITTED")
    averageScore = submittedAttempts.length
      ? Math.round(submittedAttempts.reduce((total, attempt) => total + (attempt.score || 0), 0) / submittedAttempts.length)
      : 0

    publishedQuizCount = await prisma.quiz.count({
      where: {
        status: "PUBLISHED",
        module: {
          enrollments: {
            some: { userId: studentUser.id, status: "ACTIVE" },
          },
        },
      },
    })

    completedQuizCount = new Set(submittedAttempts.map((attempt) => attempt.quizId)).size

    const dashboardQuizzes = moduleIds.length
      ? await prisma.quiz.findMany({
          where: {
            status: "PUBLISHED",
            moduleId: { in: moduleIds },
            module: {
              enrollments: {
                some: { userId: studentUser.id, status: "ACTIVE" },
              },
            },
          },
          include: { module: { select: { code: true, name: true } } },
          orderBy: [{ module: { code: "asc" } }, { dueAt: "asc" }, { createdAt: "desc" }],
        })
      : []

    const nowTs = new Date().getTime()
    const attemptStatsByQuiz = createStudentAttemptStats(quizAttempts)
    upcomingQuizzes = dashboardQuizzes
      .map((quiz) => {
        const stats = attemptStatsByQuiz[quiz.id] || { submittedCount: 0, inProgressCount: 0, bestScore: null }
        const state = getStudentQuizProgressState(quiz, stats, nowTs)
        return {
          id: quiz.id,
          title: quiz.title,
          state,
          moduleCode: quiz.module.code,
          moduleName: quiz.module.name,
          submittedAttempts: stats.submittedCount,
          maxAttempts: quiz.maxAttempts,
          bestScore: stats.bestScore,
          badgeText: badgeTextForState(state),
          releaseText: quiz.publishedAt ? formatDateTime(quiz.publishedAt) : "Available now",
          dueText: quiz.dueAt ? formatDate(quiz.dueAt) : "No due date",
          dueAtTs: quiz.dueAt ? new Date(quiz.dueAt).getTime() : Number.MAX_SAFE_INTEGER,
          releaseAtTs: quiz.publishedAt ? new Date(quiz.publishedAt).getTime() : 0,
        }
      })
      .filter((quiz) => quiz.state === "TO_DO" || quiz.state === "IN_PROGRESS" || quiz.state === "UPCOMING")
      .sort((a, b) => a.dueAtTs - b.dueAtTs)
      .slice(0, 5)
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error
    }

    databaseUnavailable = true

    studentUser = {
      id: "offline-preview",
      email: "student@example.com",
      studentNumber: "Demo",
    }

  }

  const coreAreas = [
    {
      title: "Modules",
      href: "/student/modules",
      stat: `${activeEnrollments.length} active`,
    },
    {
      title: "Lectures",
      href: "/student/lectures",
      stat: `${lectureCount} available`,
    },
    {
      title: "Analogies",
      href: "/student/analogies",
      stat: `${recentAnalogies.length} recent`,
    },
    {
      title: "Quizzes",
      href: "/student/quizzes",
      stat: `${publishedQuizCount} published`,
    },
    {
      title: "Statistics",
      href: "/student/statistics",
      stat: `${averageScore}% average`,
    },
  ]

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Student Dashboard</h1>
            <p className={ui.textSmall}>A cleaner home for your modules, quizzes, and progress.</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-stone-700">
              <span className="font-medium">{studentUser.email}</span> · Student
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} py-6 space-y-6`}>
          {databaseUnavailable ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Database is unavailable in this environment. Showing a safe preview state so UI screenshots can still be captured.
            </div>
          ) : null}

          <div className={ui.cardFull}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className={ui.textLabel}>Overview</p>
                <h2 className="text-xl font-semibold">Everything important in one place</h2>
                <p className="mt-2 max-w-2xl text-sm text-stone-700">
                  Jump quickly into modules, lectures, analogies, quizzes, and statistics while keeping your current progress in view.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div className={ui.cardInner}>
                  <p className={ui.textLabel}>Modules</p>
                  <p className="mt-1 text-lg font-semibold">{activeEnrollments.length}</p>
                </div>
                <div className={ui.cardInner}>
                  <p className={ui.textLabel}>Lectures</p>
                  <p className="mt-1 text-lg font-semibold">{lectureCount}</p>
                </div>
                <div className={ui.cardInner}>
                  <p className={ui.textLabel}>Quizzes</p>
                  <p className="mt-1 text-lg font-semibold">{publishedQuizCount}</p>
                </div>
                <div className={ui.cardInner}>
                  <p className={ui.textLabel}>Avg score</p>
                  <p className="mt-1 text-lg font-semibold">{averageScore}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className={ui.cardFull}>
            <div className="mb-4">
              <h3 className={ui.cardHeader}>Core areas</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {coreAreas.map((area) => (
                <Link
                  key={area.title}
                  href={area.href}
                  className={`${ui.cardInner} block transition hover:border-teal-300 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2`}
                >
                  <div>
                    <p className={ui.textHighlight}>{area.stat}</p>
                    <h4 className="mt-1 text-base font-semibold">{area.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className={ui.cardFull}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className={ui.cardHeader}>Upcoming quizzes</h3>
                <Link href="/student/quizzes" className={ui.buttonSecondary}>View all quizzes</Link>
              </div>
              <div className="space-y-3 text-sm">
                {upcomingQuizzes.map((quiz) => <QuizLink key={quiz.id} quiz={quiz} />)}
                {upcomingQuizzes.length === 0 ? <p className={ui.textSmall}>No upcoming quizzes right now.</p> : null}
              </div>
            </div>

            <div className={ui.cardFull}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className={ui.cardHeader}>Recent analogies</h3>
                <Link href="/student/analogies" className={ui.buttonSecondary}>View all analogies</Link>
              </div>
              <div className="space-y-2 text-sm">
                {recentAnalogies.map((analogy) => (
                  <Link key={analogy.id} href={`/student/analogies/${analogy.id}`} className={ui.linkCard}>
                    <p className="font-medium">{analogy.title || analogy.lecture?.title || "Analogy set"}</p>
                    <p className="text-xs text-stone-600">{analogy.module?.code || "Module"}</p>
                  </Link>
                ))}
                {recentAnalogies.length === 0 ? <p className={ui.textSmall}>No approved analogies available yet.</p> : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
