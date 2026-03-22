import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import * as ui from "../../styles/ui"

export default async function LecturerLecturesPage({ searchParams }) {
  const lecturer = await getCurrentUser("LECTURER", { id: true })
  if (!lecturer) redirect("/lecturer/login")

  const resolvedSearchParams = await searchParams
  const moduleCode = String(resolvedSearchParams?.module || "").trim().toUpperCase()

  let moduleFilter = null
  if (moduleCode) {
    moduleFilter = await prisma.module.findFirst({
      where: { code: moduleCode, lecturerId: lecturer.id },
      select: { id: true, code: true },
    })
  }

  const [modules, lectures] = await Promise.all([
    prisma.module.findMany({
      where: { lecturerId: lecturer.id },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    }),
    prisma.lecture.findMany({
      where: {
        ownerId: lecturer.id,
        ...(moduleFilter ? { moduleId: moduleFilter.id } : {}),
      },
      include: {
        module: { select: { code: true, name: true } },
        _count: { select: { analogySets: true } },
      },
      orderBy: [{ createdAt: "desc" }],
    }),
  ])

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <p className={ui.textLabel}>Lecturer · Lectures</p>
            <h1 className="text-lg font-semibold">Lecture library</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/lecturer" className={ui.buttonSecondary}>Back to dashboard</Link>
            <Link href="/lecturer/analogies/upload-slides" className={ui.buttonPrimary}>Upload lecture slides</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link href="/lecturer/lectures" className={!moduleCode ? ui.buttonPrimary : ui.buttonSecondary}>All modules</Link>
              {modules.map((module) => (
                <Link
                  key={module.id}
                  href={`/lecturer/lectures?module=${encodeURIComponent(module.code)}`}
                  className={moduleCode === module.code ? ui.buttonPrimary : ui.buttonSecondary}
                >
                  {module.code}
                </Link>
              ))}
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Lectures</h2>
            {lectures.length === 0 ? (
              <p className={ui.textSmall}>No lectures found for this selection.</p>
            ) : (
              <div className="space-y-3 text-sm">
                {lectures.map((lecture) => (
                  <Link key={lecture.id} href={`/lecturer/lectures/${lecture.id}`} className={`${ui.cardList} block hover:border-indigo-400 transition`}>
                    <p className="font-semibold text-slate-100">{lecture.title}</p>
                    <p className="text-xs text-slate-400">
                      {lecture.module.code} · {lecture._count.analogySets} analogy sets · {new Date(lecture.createdAt).toLocaleDateString()}
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
