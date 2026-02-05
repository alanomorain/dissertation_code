import Link from "next/link"
import { prisma } from "../lib/db"
import * as ui from "../styles/ui"

export default async function LecturerDashboard() {
  // Mock data for now 
  const taughtModules = [
    {
      code: "CSC7058",
      name: "Software Development Project",
      students: 24,
      analogies: 12,
    },
    {
      code: "CSC7084",
      name: "Web Development",
      students: 32,
      analogies: 18,
    },
  ]

  const recentUploads = await prisma.analogySet.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { module: true },
  })

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
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/lecturer/analogies/upload-slides"
              className={ui.buttonSecondary}
            >
              Upload slides
            </Link>
            <Link
              href="/lecturer/analogies/new"
              className={ui.buttonSecondary}
            >
              New analogy
            </Link>
            <Link
              href="/lecturer/modules/create"
              className={ui.buttonPrimary}
            >
              Create module
            </Link>
            <span className="hidden sm:inline text-slate-300">
              Signed in as <span className="font-medium">Lecturer User</span>
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
          {/* Intro cards */}
          <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
            <div className={ui.cardFull}>
              <h2 className="text-xl font-semibold mb-2">
                Welcome back, Lecturer 👋
              </h2>
              <p className="text-sm text-slate-300 mb-3">
                Create and manage analogies for your modules, set quizzes, and
                review how students are engaging with the material.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/lecturer/analogies/upload-slides" className={ui.buttonSecondary}>
                  Upload slides
                </Link>
                <Link href="/lecturer/analogies/new" className={ui.buttonSecondary}>
                  New analogy
                </Link>
                <Link href="/lecturer/modules/create" className={ui.buttonPrimary}>
                  Create module
                </Link>
              </div>
            </div>

            <div className={`${ui.cardFull} text-sm`}>
              <h3 className="text-base font-semibold">Quick Overview</h3>
              <ul className="space-y-1 text-slate-300">
                <li>• You teach {taughtModules.length} modules</li>
                <li>• {recentUploads.length} recent analogy uploads</li>
                <li>• {pendingQuizzes.length} quizzes in progress</li>
              </ul>
            </div>
          </div>

          {/* Main grid: modules + side panels */}
          <div className="grid gap-6 lg:grid-cols-[2fr,1.5fr]">
            {/* Modules you teach */}
            <div className={ui.cardFull}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={ui.cardHeader}>Modules you teach</h3>
              </div>

              <div className="space-y-3 text-sm">
                {taughtModules.map((mod) => (
                  <div
                    key={mod.code}
                    className={ui.cardList}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="font-medium">
                          {mod.code} · {mod.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {mod.students} students · {mod.analogies} analogies
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
                        <button className="text-xs rounded-lg border border-slate-600 px-3 py-1 hover:border-indigo-400 hover:text-indigo-200 transition">
                          Create quiz
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column: uploads + quizzes */}
            <div className="space-y-6">
              {/* Recent analogy uploads */}
              <div className={ui.cardFull}>
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

              {/* Quizzes in progress */}
              <div className={ui.cardFull}>
                <h3 className={ui.cardHeader}>
                  Quizzes in progress
                </h3>
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
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
