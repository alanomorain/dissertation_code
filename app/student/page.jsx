import Link from "next/link"
import { redirect } from "next/navigation"
import SignOutButton from "../components/SignOutButton"
import { prisma } from "../lib/db"
import { getCurrentUser } from "../lib/currentUser"
import * as ui from "../styles/ui"

function QuickStatBar({ label, value, description, barClass }) {
  const clampedValue = Math.max(0, Math.min(100, value))

  return (
    <div className="rounded-xl border border-slate-800/50 bg-slate-900/70 px-3 py-2">
      <div className="mb-2 flex items-center justify-between text-sm">
        <p className="text-slate-300">{label}</p>
        <p className="font-semibold text-slate-100">{clampedValue}%</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800/80">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-400">{description}</p>
    </div>
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
  let completionRate = 0
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
      include: { module: true },
      orderBy: { createdAt: "desc" },
    })

    const moduleIds = activeEnrollments.map((enrollment) => enrollment.moduleId)

    recentAnalogies = moduleIds.length
      ? await prisma.analogySet.findMany({
          where: {
            status: "ready",
            reviewStatus: "APPROVED",
            moduleId: { in: moduleIds },
          },
          include: { module: { select: { code: true, name: true } } },
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
        status: "SUBMITTED",
        quiz: {
          status: "PUBLISHED",
          module: {
            enrollments: {
              some: { userId: studentUser.id, status: "ACTIVE" },
            },
          },
        },
      },
      select: { score: true, quizId: true },
    })

    averageScore = quizAttempts.length
      ? Math.round(quizAttempts.reduce((total, attempt) => total + (attempt.score || 0), 0) / quizAttempts.length)
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

    completedQuizCount = new Set(quizAttempts.map((attempt) => attempt.quizId)).size
    completionRate = publishedQuizCount ? Math.round((completedQuizCount / publishedQuizCount) * 100) : 0

    upcomingQuizzes = await prisma.quiz.findMany({
      where: {
        status: "PUBLISHED",
        module: {
          enrollments: {
            some: { userId: studentUser.id, status: "ACTIVE" },
          },
        },
      },
      select: {
        id: true,
        title: true,
        dueAt: true,
        module: { select: { code: true } },
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      take: 4,
    })
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

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Student Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-slate-300">
              <span className="font-medium">{studentUser.email}</span> · Student
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} py-6 space-y-5`}>
          {databaseUnavailable ? (
            <div className="rounded-xl border border-amber-500/50 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
              Database is unavailable in this environment. Showing a safe preview state so UI screenshots can still be captured.
            </div>
          ) : null}

          <div className={ui.cardFull}>
            <h2 className="text-xl font-semibold mb-2">Welcome back 👋</h2>
            <p className="text-sm text-slate-300 mb-3">
              Complete published quizzes, review linked learning media in quiz flow, and track your performance trends.
            </p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className={ui.cardInner}>
                <h3 className="text-base font-semibold mb-1">Modules</h3>
                <p className="text-sm text-slate-300 mb-3">Open your enrolled module spaces.</p>
                <Link href="/student/modules" className={ui.buttonPrimary}>View modules</Link>
              </div>
              <div className={ui.cardInner}>
                <h3 className="text-base font-semibold mb-1">Lectures</h3>
                <p className="text-sm text-slate-300 mb-3">Browse lecture-specific module content.</p>
                <Link href="/student/lectures" className={ui.buttonPrimary}>View lectures</Link>
              </div>
              <div className={ui.cardInner}>
                <h3 className="text-base font-semibold mb-1">Quizzes</h3>
                <p className="text-sm text-slate-300 mb-3">Take quizzes for your active modules and review feedback.</p>
                <Link href="/student/quizzes" className={ui.buttonPrimary}>Open quizzes</Link>
              </div>
              <div className={ui.cardInner}>
                <h3 className="text-base font-semibold mb-1">Statistics</h3>
                <p className="text-sm text-slate-300 mb-3">Monitor scores, attempts, and engagement across modules.</p>
                <Link href="/student/statistics" className={ui.buttonPrimary}>View statistics</Link>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr,1.5fr]">
            <div className={ui.cardFull}>
              <h3 className={ui.cardHeader}>Your active modules</h3>
              <div className="space-y-3 text-sm">
                {activeEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className={ui.cardList}>
                    <p className="font-medium">{enrollment.module.code} · {enrollment.module.name}</p>
                    <p className="text-xs text-slate-400">Enrollment active</p>
                  </div>
                ))}
                {activeEnrollments.length === 0 ? <p className={ui.textSmall}>No active module enrollments yet.</p> : null}
              </div>
            </div>

            <div className="space-y-6">
              <div className={ui.cardFull}>
                <h3 className={ui.cardHeader}>Quick stats</h3>
                <ul className="mb-4 space-y-1 text-sm text-slate-300">
                  <li>• {activeEnrollments.length} active modules</li>
                  <li>• {lectureCount} lectures with approved analogies</li>
                  <li>• {publishedQuizCount} published quizzes</li>
                  <li>• {recentAnalogies.length} approved analogies</li>
                  <li>• {completedQuizCount} quizzes completed</li>
                </ul>
                <div className="space-y-3">
                  <QuickStatBar
                    label="Quiz completion"
                    value={completionRate}
                    description={publishedQuizCount ? `${completedQuizCount} of ${publishedQuizCount} quizzes completed` : "No published quizzes yet"}
                    barClass="bg-emerald-500"
                  />
                  <QuickStatBar
                    label="Average quiz score"
                    value={averageScore}
                    description={quizAttempts.length ? `Based on ${quizAttempts.length} submitted attempts` : "No submitted attempts yet"}
                    barClass="bg-indigo-500"
                  />
                </div>
              </div>

              <div className={ui.cardFull}>
                <h3 className={ui.cardHeader}>Upcoming quizzes</h3>
                <div className="space-y-2 text-sm">
                  {upcomingQuizzes.map((quiz) => (
                    <Link key={quiz.id} href={`/student/quizzes/${quiz.id}/start`} className={ui.linkCard}>
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-xs text-slate-400">{quiz.module.code} · Due {quiz.dueAt ? new Date(quiz.dueAt).toLocaleDateString() : "Any time"}</p>
                    </Link>
                  ))}
                  {upcomingQuizzes.length === 0 ? <p className={ui.textSmall}>No published quizzes available right now.</p> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
