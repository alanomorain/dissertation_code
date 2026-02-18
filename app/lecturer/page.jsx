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
        take: 2,
        include: { module: true },
      })
    : []

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
            <div className="grid gap-4 md:grid-cols-3">
              <div className={ui.cardInner}>
                <h3 className="text-base font-semibold mb-1">Analogies</h3>
                <p className="text-sm text-slate-300 mb-3">
                  Manage your analogy library and create new content for modules.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href="/lecturer/analogies" className={ui.buttonPrimary}>
                    Manage analogies
                  </Link>
                  <Link href="/lecturer/analogies/upload-slides" className={ui.buttonSmall}>
                    Upload slides
                  </Link>
                  <Link href="/lecturer/analogies/new" className={ui.buttonSmall}>
                    New analogy
                  </Link>
                </div>
              </div>

              <div className={ui.cardInner}>
                <h3 className="text-base font-semibold mb-1">Quizzes</h3>
                <p className="text-sm text-slate-300 mb-3">
                  Create quizzes, publish them to students, and review outcomes.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href="/lecturer/quizzes" className={ui.buttonPrimary}>
                    Manage quizzes
                  </Link>
                  <Link href="/lecturer/quizzes/new" className={ui.buttonSmall}>
                    New quiz
                  </Link>
                </div>
              </div>

              <div className={ui.cardInner}>
                <h3 className="text-base font-semibold mb-1">Statistics</h3>
                <p className="text-sm text-slate-300 mb-3">
                  Track analogy engagement and student performance trends.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href="/lecturer/statistics" className={ui.buttonPrimary}>
                    View statistics
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main grid: modules + recent uploads */}
          <div className="grid gap-6 lg:grid-cols-[2fr,1.5fr]">
            {/* Modules you teach */}
            <div className={ui.cardFull}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={ui.cardHeader}>Modules you teach</h3>
                <div className="flex items-center gap-2">
                  <Link href="/lecturer/modules/create" className={ui.buttonSmall}>
                    New module
                  </Link>
                </div>
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
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          href={`/lecturer/analogies/upload-slides?module=${encodeURIComponent(mod.code)}`}
                          className={ui.buttonSmall}
                        >
                          Upload slides
                        </Link>
                        <Link
                          href={`/lecturer/analogies/new?module=${encodeURIComponent(mod.code)}`}
                          className={ui.buttonSmall}
                        >
                          New analogy
                        </Link>
                        <Link
                          href={`/lecturer/quizzes/new?module=${encodeURIComponent(mod.code)}`}
                          className={ui.buttonSmall}
                        >
                          New quiz
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

            {/* Recent analogy uploads */}
            <div className={ui.cardFull}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className={ui.cardHeader}>Recent analogy uploads</h3>
              </div>
              {recentUploads.length === 0 ? (
                <p className="text-sm text-slate-400">
                  You haven&apos;t created any analogies yet.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {recentUploads.map((item) => (
                    <li
                      key={item.id}
                      className={`${ui.cardInner} flex items-center justify-between`}
                    >
                      <div>
                        <p className="font-medium">{item.title || "Untitled"}</p>
                        <p className="text-xs text-slate-400">
                          Module: {item.module?.code || "Unassigned"} · Created: {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Link href={`/lecturer/analogies/${item.id}`} className={ui.buttonSmall}>
                        Continue
                      </Link>
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
