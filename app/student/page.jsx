import Link from "next/link"
import { prisma } from "../lib/db"
import { getCurrentUser } from "../lib/currentUser"
import * as ui from "../styles/ui"

export default async function StudentDashboard() {
  const studentUser = await getCurrentUser("STUDENT", {
    id: true,
    email: true,
  })

  const enrollments = studentUser
    ? await prisma.moduleEnrollment.findMany({
        where: { userId: studentUser.id },
        include: { module: true },
        orderBy: { createdAt: "desc" },
      })
    : []

  const activeEnrollments = enrollments.filter(
    (enrollment) => enrollment.status === "ACTIVE",
  )

  const moduleIds = enrollments.map((enrollment) => enrollment.moduleId)

  const recentAnalogies = moduleIds.length
    ? await prisma.analogySet.findMany({
        where: {
          status: "ready",
          reviewStatus: "APPROVED",
          moduleId: { in: moduleIds },
        },
        orderBy: { createdAt: "desc" },
        take: 4,
      })
    : []

  const upcomingQuizWhere = studentUser
    ? {
        status: "PUBLISHED",
        module: {
          enrollments: {
            some: { userId: studentUser.id, status: "ACTIVE" },
          },
        },
      }
    : null

  const upcomingQuizzesCount = upcomingQuizWhere
    ? await prisma.quiz.count({ where: upcomingQuizWhere })
    : 0

  const upcomingQuizzes = upcomingQuizWhere
    ? await prisma.quiz.findMany({
        where: upcomingQuizWhere,
        select: {
          id: true,
          title: true,
          dueAt: true,
        },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        take: 4,
      })
    : []

  return (
    <main className={ui.page}>
      {/* Top bar */}
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">
              Student Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-slate-300">
              <span className="font-medium">
                {studentUser?.email || "student@example.com"}
              </span>{" "}
              signed in as a Student
            </span>
            <Link
              href="/"
              className={ui.buttonSecondary}
            >
              Log out
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <section className={ui.pageSection}>
        <div className={`${ui.container} py-6 space-y-6`}>
          {/* Greeting  */}
          <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
            <div className={ui.cardFull}>
              <h2 className="text-xl font-semibold mb-2">
                Welcome back, Student 👋
              </h2>
              <p className="text-sm text-slate-300 mb-3">
                Continue exploring analogies for your modules, review recent
                explanations, and take short quizzes to check your understanding.
              </p>
            </div>

            {/* Stats  */}
            <div className={`${ui.cardFull} text-sm`}>
              <h3 className="text-base font-semibold">Quick Stats</h3>
              <ul className="space-y-1 text-slate-300">
                <li>• {activeEnrollments.length} active modules</li>
                <li>• {upcomingQuizzesCount} upcoming quizzes</li>
                <li>• {recentAnalogies.length} recent analogies</li>
              </ul>
            </div>
          </div>

          {/* Modules & analogies */}
          <div className="grid gap-6 lg:grid-cols-[2fr,1.5fr]">
            {/* Modules list */}
            <div className={ui.cardFull}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={ui.cardHeader}>Your modules</h3>
              </div>
              <div className="space-y-3 text-sm">
                {enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className={ui.cardList}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="font-medium">
                          {enrollment.module.code} · {enrollment.module.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          Status: {enrollment.status}
                        </p>
                      </div>
                      <Link href="/student/analogies">
                        <button
                          type="button"
                          className="text-xs rounded-lg bg-indigo-500 px-3 py-1 font-medium hover:bg-indigo-400 transition"
                        >
                          View analogies
                        </button>
                      </Link>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-800">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500"
                        style={{
                          width: enrollment.status === "ACTIVE" ? "80%" : "30%",
                        }}
                      />
                    </div>
                  </div>
                ))}
                {enrollments.length === 0 && (
                  <p className={ui.textSmall}>
                    No module enrollments available yet.
                  </p>
                )}
              </div>
            </div>

            {/* Recent analogies */}
            <div className="space-y-6">
              <div className={ui.cardFull}>
                <h3 className={ui.cardHeader}>
                  Recent analogies
                </h3>
                <div className="space-y-3 text-sm">
                  {recentAnalogies.map((item) => (
                    <div
                      key={item.id}
                      className={ui.cardInner}
                    >
                      <p className={`${ui.textHighlight} mb-1`}>
                        {item.title || "Untitled"}
                      </p>
                      <p className="text-slate-200">
                        {item.moduleId ? "Module linked" : "Unassigned"}
                      </p>
                    </div>
                  ))}
                  {recentAnalogies.length === 0 && (
                    <p className={ui.textSmall}>
                      No recent analogies for your modules.
                    </p>
                  )}
                </div>
              </div>

              {/* Upcoming quizzes */}
              <div className={ui.cardFull}>
                <h3 className={ui.cardHeader}>
                  Upcoming quizzes
                </h3>
                {upcomingQuizzes.length === 0 ? (
                  <p className={ui.textSmall}>
                    No quizzes scheduled. Your lecturer hasn&apos;t created any yet.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {upcomingQuizzes.map((quiz) => (
                      <li
                        key={quiz.id}
                        className={`${ui.cardInner} flex items-center justify-between`}
                      >
                        <div>
                          <p className="font-medium">{quiz.title}</p>
                          <p className="text-xs text-slate-400">
                            Due: {quiz.dueAt ? new Date(quiz.dueAt).toLocaleString() : "No due date"}
                          </p>
                        </div>
                        <Link href={`/student/quizzes/${quiz.id}/start`} className={ui.buttonSmall}>
                          Start
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
