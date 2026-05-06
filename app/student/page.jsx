import Link from "next/link"
import { redirect } from "next/navigation"
import SignOutButton from "../components/SignOutButton"
import { prisma } from "../lib/db"
import { getCurrentUser } from "../lib/currentUser"
import * as ui from "../styles/ui"

const formatDate = (value) => new Date(value).toLocaleDateString()

function QuickStatBar({ label, value, description, barClass }) {
  const clampedValue = Math.max(0, Math.min(100, value))

  return (
    <div className="rounded-xl border border-stone-200 bg-white px-3 py-2">
      <div className="mb-2 flex items-center justify-between text-sm">
        <p className="text-stone-700">{label}</p>
        <p className="font-semibold text-stone-950">{clampedValue}%</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-stone-600">{description}</p>
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
        <div className={`${ui.container} py-6 space-y-5`}>
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

          <div className="grid grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-6">
            <div id="modules" className={`${ui.cardFull} relative`}>
              <Link
                href="/student/modules"
                className="absolute inset-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                aria-label="View enrolled modules"
              />
              <div className="relative z-10 pointer-events-none">
                <div className="mb-4">
                  <h3 className={ui.cardHeader}>Your active modules</h3>
                </div>
                {activeEnrollments.length === 0 ? (
                  <p className={ui.textSmall}>No active module enrollments yet.</p>
                ) : (
                  <div className="space-y-3 text-sm">
                    {activeEnrollments.map((enrollment) => (
                      <Link
                        key={enrollment.id}
                        href={`/student/lectures?module=${encodeURIComponent(enrollment.module.code)}`}
                        className={`${ui.linkCard} pointer-events-auto`}
                      >
                        <p className="font-medium text-stone-950">{enrollment.module.code} · {enrollment.module.name}</p>
                        <p className="text-xs text-stone-600">
                          {enrollment.module._count.lectures} lectures · {enrollment.module._count.quizzes} quizzes
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className={ui.cardFull}>
                <div className="mb-3">
                  <h3 className={ui.cardHeader}>Progress snapshot</h3>
                </div>
                <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                  <div className={ui.cardInner}>
                    <p className={ui.textLabel}>Completed</p>
                    <p className="mt-1 text-lg font-semibold">{completedQuizCount}</p>
                  </div>
                  <div className={ui.cardInner}>
                    <p className={ui.textLabel}>Analogies</p>
                    <p className="mt-1 text-lg font-semibold">{recentAnalogies.length}</p>
                  </div>
                </div>
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
                    barClass="bg-teal-600"
                  />
                </div>
              </div>

              <div className={ui.cardFull}>
                <div className="mb-3">
                  <h3 className={ui.cardHeader}>Upcoming quizzes</h3>
                </div>
                <div className="space-y-2 text-sm">
                  {upcomingQuizzes.map((quiz) => (
                    <Link key={quiz.id} href={`/student/quizzes/${quiz.id}/start`} className={ui.linkCard}>
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-xs text-stone-600">{quiz.module.code} · Due {quiz.dueAt ? formatDate(quiz.dueAt) : "Any time"}</p>
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
