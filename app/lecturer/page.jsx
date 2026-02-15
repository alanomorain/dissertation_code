import Link from "next/link"
import { prisma } from "../lib/db"
import { getCurrentUser } from "../lib/currentUser"
import * as ui from "../styles/ui"

export default async function LecturerDashboard() {
  const lecturerUser = await getCurrentUser("LECTURER", {
    id: true,
    email: true,
  })

  const taughtModules = lecturerUser
    ? await prisma.module.findMany({
        where: { lecturerId: lecturerUser.id },
        include: {
          enrollments: true,
          analogySets: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : []

  const recentUploads = lecturerUser
    ? await prisma.analogySet.findMany({
        where: { ownerId: lecturerUser.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { module: true },
      })
    : []

  const pendingQuizzes = [
    {
      id: 1,
      module: "CSC7084",
      title: "CSS Layout Analogies",
      status: "Draft",
    },
    {
      id: 2,
      module: "CSC7058",
      title: "Docker & Containers",
      status: "Needs questions",
    },
  ]

  return (
    <main className={ui.page}>
      {/* Top bar */}
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">
              Lecturer Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-slate-300">
              <span className="font-medium">
                {lecturerUser?.email || "lecturer@example.com"}
              </span>{" "}
              signed in as a Lecturer
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
        <div className={`${ui.container} py-6 space-y-5`}>
          {/* Intro */}
          <div className={ui.cardFull}>
            <h2 className="text-xl font-semibold mb-2">
              Welcome back, Lecturer 👋
            </h2>
            <p className="text-sm text-slate-300 mb-3">
              Create and manage analogies for your modules, set quizzes, and
              review how students are engaging with the material.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/lecturer/statistics" className={ui.buttonPrimary}>
                View statistics
              </Link>
              <Link href="/lecturer/analogies/upload-slides" className={ui.buttonPrimary}>
                Upload slides
              </Link>
              <Link href="/lecturer/analogies/new" className={ui.buttonPrimary}>
                New analogy
              </Link>
              <Link href="/lecturer/modules/create" className={ui.buttonPrimary}>
                Create module
              </Link>
            </div>
          </div>

          <div className={ui.cardFull}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold">Statistics at a glance</h3>
                <p className="text-sm text-slate-300">
                  Track analogy performance, student engagement, and top performers in one place.
                </p>
              </div>
              <Link href="/lecturer/statistics" className={ui.buttonPrimary}>
                Open statistics dashboard
              </Link>
            </div>
          </div>

          {/* Main grid: modules + quizzes + recent analogies */}
          <div className="grid gap-6 lg:grid-cols-[2fr,1.5fr]">
            {/* Modules you teach */}
            <div className={ui.cardFull}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={ui.cardHeader}>Modules you teach</h3>
              </div>

              <div className="space-y-3 text-sm">
                {taughtModules.map((mod) => (
                  <div
                    key={mod.id}
                    className={ui.cardList}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="font-medium">
                          {mod.code} · {mod.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {mod.enrollments.length} students · {mod.analogySets.length} analogies
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href="/lecturer/analogies">
                            <button
                                type="button"
                                className="text-xs rounded-lg bg-indigo-500 px-3 py-1 font-medium hover:bg-indigo-400 transition"
                            >
                                Manage Analogies
                            </button>
                        </Link>
                        <Link href="/lecturer/quizzes/new">
                          <button className="text-xs rounded-lg border border-slate-600 px-3 py-1 hover:border-indigo-400 hover:text-indigo-200 transition">
                            Create quiz
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                {taughtModules.length === 0 && (
                  <p className={ui.textSmall}>
                    No modules assigned yet.
                  </p>
                )}
              </div>
            </div>

            {/* Quizzes */}
            <div className={ui.cardFull}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={ui.cardHeader}>Quizzes</h3>
                <Link href="/lecturer/quizzes/new" className={ui.buttonSmall}>
                  New quiz
                </Link>
              </div>
              {pendingQuizzes.length === 0 ? (
                <p className={ui.textSmall}>
                  No quizzes in draft state.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {pendingQuizzes.map((quiz) => (
                    <li
                      key={quiz.id}
                      className={`${ui.cardInner} flex items-center justify-between`}
                    >
                      <div>
                        <p className="font-medium">{quiz.title}</p>
                        <p className="text-xs text-slate-400">
                          Module: {quiz.module} · Status: {quiz.status}
                        </p>
                      </div>
                      <button className={ui.buttonSmall}>
                        Continue
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Recent analogy uploads */}
            <div className={`${ui.cardFull} lg:col-span-2`}>
              <h3 className={`${ui.cardHeader} mb-3`}>
                Recent analogy uploads
              </h3>
              {recentUploads.length === 0 ? (
                <p className="text-sm text-slate-400">
                  You haven&apos;t created any analogies yet.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {recentUploads.map((item) => (
                    <li
                      key={item.id}
                      className={ui.cardInner}
                    >
                      <p className="font-medium">{item.title || "Untitled"}</p>
                      <p className="text-xs text-slate-400">
                        Module: {item.module?.code || "Unassigned"} · Created: {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
