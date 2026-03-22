import Link from "next/link"
import { redirect } from "next/navigation"
import SignOutButton from "../components/SignOutButton"
import { prisma } from "../lib/db"
import { getCurrentUser } from "../lib/currentUser"
import * as ui from "../styles/ui"

const formatDate = (value) => new Date(value).toLocaleDateString()

export default async function LecturerDashboard() {
  const lecturerUser = await getCurrentUser("LECTURER", {
    id: true,
    email: true,
  })

  if (!lecturerUser) {
    redirect("/lecturer/login")
  }

  const taughtModules = await prisma.module.findMany({
    where: { lecturerId: lecturerUser.id },
    include: {
      enrollments: true,
      analogySets: true,
      lectures: true,
      quizzes: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const recentUploads = await prisma.analogySet.findMany({
    where: { ownerId: lecturerUser.id },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { module: true },
  })

  const totalStudents = taughtModules.reduce((count, moduleItem) => count + moduleItem.enrollments.length, 0)
  const totalAnalogies = taughtModules.reduce((count, moduleItem) => count + moduleItem.analogySets.length, 0)
  const totalLectures = taughtModules.reduce((count, moduleItem) => count + moduleItem.lectures.length, 0)
  const totalQuizzes = taughtModules.reduce((count, moduleItem) => count + moduleItem.quizzes.length, 0)

  const coreAreas = [
    {
      title: "Modules",
      description: "See and organise all module spaces you teach.",
      href: "/lecturer/modules",
      cta: "Open modules",
      secondaryHref: "/lecturer/modules/create",
      secondaryCta: "Create module",
      stat: `${taughtModules.length} active`,
    },
    {
      title: "Lectures",
      description: "Manage lecture uploads and lecture-specific content.",
      href: "/lecturer/lectures",
      cta: "Open lectures",
      secondaryHref: "/lecturer/analogies/upload-slides",
      secondaryCta: "Upload slides",
      stat: `${totalLectures} total`,
    },
    {
      title: "Analogies",
      description: "Build and maintain analogy content for your classes.",
      href: "/lecturer/analogies",
      cta: "Open analogies",
      secondaryHref: "/lecturer/analogies/new",
      secondaryCta: "Create analogy",
      stat: `${totalAnalogies} total`,
    },
    {
      title: "Quizzes",
      description: "Create, publish, and monitor assessments.",
      href: "/lecturer/quizzes",
      cta: "Open quizzes",
      secondaryHref: "/lecturer/quizzes/new",
      secondaryCta: "New quiz",
      stat: `${totalQuizzes} total`,
    },
    {
      title: "Statistics",
      description: "Track engagement and learner outcomes by module.",
      href: "/lecturer/statistics",
      cta: "View statistics",
      secondaryHref: "/lecturer/statistics",
      secondaryCta: "Module insights",
      stat: `${taughtModules.length} modules tracked`,
    },
    {
      title: "Student management",
      description: "Manage access, invites, and cohort membership.",
      href: "/lecturer/students",
      cta: "Manage students",
      secondaryHref: "/lecturer/students/invite",
      secondaryCta: "Invite students",
      stat: `${totalStudents} enrolled`,
    },
  ]

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Lecturer Dashboard</h1>
            <p className={ui.textSmall}>A cleaner home for your core teaching workflows.</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-slate-300">
              <span className="font-medium">{lecturerUser.email}</span> signed in as a Lecturer
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} py-6 space-y-6`}>
          <div className={ui.cardFull}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className={ui.textLabel}>Overview</p>
                <h2 className="text-xl font-semibold">Everything important in one place</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  Jump quickly into modules, analogies, quizzes, statistics, and student management without hunting through scattered actions.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div className={ui.cardInner}>
                  <p className={ui.textLabel}>Modules</p>
                  <p className="mt-1 text-lg font-semibold">{taughtModules.length}</p>
                </div>
                <div className={ui.cardInner}>
                  <p className={ui.textLabel}>Students</p>
                  <p className="mt-1 text-lg font-semibold">{totalStudents}</p>
                </div>
                <div className={ui.cardInner}>
                  <p className={ui.textLabel}>Analogies</p>
                  <p className="mt-1 text-lg font-semibold">{totalAnalogies}</p>
                </div>
                <div className={ui.cardInner}>
                  <p className={ui.textLabel}>Quizzes</p>
                  <p className="mt-1 text-lg font-semibold">{totalQuizzes}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={ui.cardFull}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={ui.cardHeader}>Core areas</h3>
              <Link href="/lecturer/modules/create" className={ui.buttonSmall}>
                New module
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              {coreAreas.map((area) => (
                <div key={area.title} className={`${ui.cardInner} flex flex-col justify-between gap-4`}>
                  <div>
                    <p className={ui.textHighlight}>{area.stat}</p>
                    <h4 className="mt-1 text-base font-semibold">{area.title}</h4>
                    <p className="mt-2 text-sm text-slate-300">{area.description}</p>
                  </div>
                  <div className="flex flex-col items-start gap-2 text-sm">
                    <Link href={area.href} className={ui.buttonPrimary}>
                      {area.cta}
                    </Link>
                    <Link href={area.secondaryHref} className="text-slate-300 hover:text-indigo-200 transition">
                      {area.secondaryCta}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div id="modules" className={ui.cardFull}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className={ui.cardHeader}>Modules you teach</h3>
                <Link href="/lecturer/modules/create" className={ui.buttonSmall}>
                  Create module
                </Link>
              </div>

              {taughtModules.length === 0 ? (
                <p className={ui.textSmall}>No modules assigned yet.</p>
              ) : (
                <div className="space-y-3 text-sm">
                  {taughtModules.map((moduleItem) => {
                    const moduleCode = encodeURIComponent(moduleItem.code)

                    return (
                      <div key={moduleItem.id} className={ui.cardList}>
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-medium text-slate-100">{moduleItem.code} · {moduleItem.name}</p>
                            <p className="text-xs text-slate-400">
                              {moduleItem.enrollments.length} students · {moduleItem.analogySets.length} analogies · {moduleItem.quizzes.length} quizzes
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-300">
                            <Link href={`/lecturer/analogies?module=${moduleCode}`} className="hover:text-indigo-200 transition">Analogies</Link>
                            <Link href={`/lecturer/lectures?module=${moduleCode}`} className="hover:text-indigo-200 transition">Lectures</Link>
                            <Link href={`/lecturer/quizzes?module=${moduleCode}`} className="hover:text-indigo-200 transition">Quizzes</Link>
                            <Link href={`/lecturer/statistics/${encodeURIComponent(moduleItem.code)}`} className="hover:text-indigo-200 transition">Statistics</Link>
                            <Link href={`/lecturer/students?module=${moduleCode}`} className="hover:text-indigo-200 transition">Students</Link>
                            <Link href={`/lecturer/analogies/new?module=${moduleCode}`} className="hover:text-indigo-200 transition">Create analogy</Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className={ui.cardFull}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className={ui.cardHeader}>Recent analogy uploads</h3>
                <Link href="/lecturer/analogies" className="text-xs text-slate-300 hover:text-indigo-200 transition">
                  View all
                </Link>
              </div>
              {recentUploads.length === 0 ? (
                <p className="text-sm text-slate-400">You haven&apos;t created any analogies yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {recentUploads.map((item) => (
                    <li key={item.id} className={`${ui.cardInner} flex items-center justify-between gap-3`}>
                      <div>
                        <p className="font-medium">{item.title || "Untitled"}</p>
                        <p className="text-xs text-slate-400">
                          {item.module?.code || "Unassigned"} · {formatDate(item.createdAt)}
                        </p>
                      </div>
                      <Link href={`/lecturer/analogies/${item.id}`} className={ui.buttonSmall}>
                        Open
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
