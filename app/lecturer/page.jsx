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
    fullName: true,
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

  const recentLectureUploads = await prisma.lecture.findMany({
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
      href: "/lecturer/modules",
      cta: "Manage",
      secondaryHref: "/lecturer/modules/create",
      secondaryCta: "+ Module",
      stat: `${taughtModules.length} active`,
    },
    {
      title: "Lectures",
      href: "/lecturer/lectures",
      cta: "Manage",
      secondaryHref: "/lecturer/analogies/upload-slides",
      secondaryCta: "+ Slides",
      stat: `${totalLectures} total`,
    },
    {
      title: "Analogies",
      href: "/lecturer/analogies",
      cta: "Manage",
      secondaryHref: "/lecturer/analogies/new",
      secondaryCta: "+ Analogy",
      stat: `${totalAnalogies} total`,
    },
    {
      title: "Quizzes",
      href: "/lecturer/quizzes",
      cta: "Manage",
      secondaryHref: "/lecturer/quizzes/new",
      secondaryCta: "+ Quiz",
      stat: `${totalQuizzes} total`,
    },
    {
      title: "Statistics",
      href: "/lecturer/statistics",
      cta: "View",
      secondaryHref: "/lecturer/statistics",
      secondaryCta: "Insights",
      stat: `${taughtModules.length} modules tracked`,
    },
    {
      title: "Students",
      href: "/lecturer/students",
      cta: "Manage",
      secondaryHref: "/lecturer/students/invite",
      secondaryCta: "+ Invite",
      stat: `${totalStudents} enrolled`,
    },
  ]

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Lecturer Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-stone-700">
              Logged in as <span className="font-medium">{lecturerUser.fullName || lecturerUser.email}</span>
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
            <div className="mb-4">
              <h3 className={ui.cardHeader}>Core areas</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              {coreAreas.map((area) => (
                <div key={area.title} className={`${ui.cardInner} flex flex-col justify-between gap-4`}>
                  <div>
                    <p className={ui.textHighlight}>{area.stat}</p>
                    <h4 className="mt-1 text-base font-semibold">{area.title}</h4>
                  </div>
                  <div className="flex flex-col items-start gap-2 text-sm">
                    <Link href={area.href} className={`${ui.buttonPrimary} w-32 text-center`}>
                      {area.cta}
                    </Link>
                    <Link href={area.secondaryHref} className="text-stone-700 hover:text-teal-700 transition">
                      {area.secondaryCta}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-6">
            <div id="modules" className={`${ui.cardFull} relative`}>
              <Link href="/lecturer/modules" className="absolute inset-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2" aria-label="Manage modules" />
              <div className="relative z-10 pointer-events-none">
                <div className="mb-4">
                  <h3 className={ui.cardHeader}>Modules you teach</h3>
                </div>

                {taughtModules.length === 0 ? (
                  <p className={ui.textSmall}>No modules assigned yet.</p>
                ) : (
                  <div className="space-y-3 text-sm">
                    {taughtModules.map((moduleItem) => {
                      const moduleCode = encodeURIComponent(moduleItem.code)

                      return (
                        <Link key={moduleItem.id} href={`/lecturer/modules/${moduleCode}`} className={`${ui.linkCard} pointer-events-auto`}>
                          <p className="font-medium text-stone-950">{moduleItem.code} · {moduleItem.name}</p>
                          <p className="text-xs text-stone-600">
                            {moduleItem.enrollments.length} students · {moduleItem.analogySets.length} analogies · {moduleItem.quizzes.length} quizzes
                          </p>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className={ui.cardFull}>
              <div className="mb-3">
                <h3 className={ui.cardHeader}>Recent lecture uploads</h3>
              </div>
              {recentLectureUploads.length === 0 ? (
                <p className="text-sm text-stone-600">You haven&apos;t uploaded any lectures yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {recentLectureUploads.map((lecture) => (
                    <li key={lecture.id} className={ui.cardInner}>
                      <p className="font-medium">{lecture.title}</p>
                      <p className="text-xs text-stone-600">
                        {lecture.module?.code || "Unassigned"} · {formatDate(lecture.createdAt)}
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
