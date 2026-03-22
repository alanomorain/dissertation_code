import Link from "next/link"
import { redirect } from "next/navigation"
import SignOutButton from "../../components/SignOutButton"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import * as ui from "../../styles/ui"

export default async function StudentLecturesPage({ searchParams }) {
  const student = await getCurrentUser("STUDENT", { id: true, email: true })
  if (!student) redirect("/student/login")

  const resolvedSearchParams = await searchParams
  const moduleCode = String(resolvedSearchParams?.module || "").trim().toUpperCase()

  const activeEnrollments = await prisma.moduleEnrollment.findMany({
    where: { userId: student.id, status: "ACTIVE" },
    include: {
      module: {
        select: { id: true, code: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const moduleIds = activeEnrollments.map((enrollment) => enrollment.moduleId)
  const moduleLookup = new Map(activeEnrollments.map((enrollment) => [enrollment.module.code, enrollment.moduleId]))
  const selectedModuleId = moduleCode ? moduleLookup.get(moduleCode) : null

  const lectures = moduleIds.length
    ? await prisma.lecture.findMany({
        where: {
          moduleId: { in: moduleIds },
          ...(selectedModuleId ? { moduleId: selectedModuleId } : {}),
          analogySets: {
            some: {
              status: "ready",
              reviewStatus: "APPROVED",
            },
          },
        },
        include: {
          module: { select: { code: true, name: true } },
          analogySets: {
            where: {
              status: "ready",
              reviewStatus: "APPROVED",
            },
            select: { id: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : []

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student · Lectures</p>
            <h1 className="text-lg font-semibold">Lecture library</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <SignOutButton />
            <Link href="/student" className={ui.buttonSecondary}>Back to dashboard</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link href="/student/lectures" className={!moduleCode ? ui.buttonPrimary : ui.buttonSecondary}>All modules</Link>
              {activeEnrollments.map((enrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/student/lectures?module=${encodeURIComponent(enrollment.module.code)}`}
                  className={moduleCode === enrollment.module.code ? ui.buttonPrimary : ui.buttonSecondary}
                >
                  {enrollment.module.code}
                </Link>
              ))}
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Lectures with approved analogies</h2>
            {lectures.length === 0 ? (
              <p className={ui.textSmall}>No lecture content is available yet.</p>
            ) : (
              <div className="space-y-3 text-sm">
                {lectures.map((lecture) => (
                  <Link key={lecture.id} href={`/student/lectures/${lecture.id}`} className={`${ui.cardList} block hover:border-indigo-400 transition`}>
                    <p className="font-semibold text-slate-100">{lecture.title}</p>
                    <p className="text-xs text-slate-400">
                      {lecture.module.code} · {lecture.analogySets.length} approved analogy sets
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
