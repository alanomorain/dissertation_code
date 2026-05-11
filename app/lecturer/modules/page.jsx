import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "../../lib/db"
import { getCurrentUser } from "../../lib/currentUser"
import { getModuleDisplayName } from "../../lib/moduleDisplay"
import * as ui from "../../styles/ui"

export default async function LecturerModulesPage() {
  const lecturer = await getCurrentUser("LECTURER", { id: true })
  if (!lecturer) redirect("/lecturer/login")

  const modules = await prisma.module.findMany({
    where: { lecturerId: lecturer.id },
    include: {
      _count: {
        select: {
          enrollments: true,
          lectures: true,
          analogySets: true,
          quizzes: true,
        },
      },
    },
    orderBy: { code: "asc" },
  })

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <p className={ui.textLabel}>Lecturer · Modules</p>
            <h1 className="text-lg font-semibold">Module Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/lecturer" className={ui.buttonSecondary}>Lecturer Dashboard</Link>
            <Link href="/lecturer/modules/create" className={ui.buttonPrimary}>+ New Module</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>All modules</h2>
            {modules.length === 0 ? (
              <p className={ui.textSmall}>No modules created yet.</p>
            ) : (
              <div className="space-y-3 text-sm">
                {modules.map((module) => (
                  <Link
                    key={module.id}
                    href={`/lecturer/modules/${encodeURIComponent(module.code)}`}
                    className={`${ui.cardList} block hover:border-teal-500 transition`}
                  >
                    <p className="font-semibold text-stone-950">{getModuleDisplayName(module)}</p>
                    <p className="text-xs text-stone-600">
                      {module._count.lectures} lectures · {module._count.analogySets} analogy sets · {module._count.quizzes} quizzes · {module._count.enrollments} students
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
