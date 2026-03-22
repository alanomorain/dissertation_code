import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "../../../lib/db"
import { getCurrentUser } from "../../../lib/currentUser"
import * as ui from "../../../styles/ui"

export default async function LecturerModuleDetailPage({ params }) {
  const lecturer = await getCurrentUser("LECTURER", { id: true })
  if (!lecturer) redirect("/lecturer/login")

  const { moduleCode } = await params
  const code = decodeURIComponent(moduleCode || "").toUpperCase()

  const moduleRecord = await prisma.module.findFirst({
    where: { code, lecturerId: lecturer.id },
    include: {
      lectures: {
        include: {
          _count: { select: { analogySets: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      analogySets: {
        select: { id: true, title: true, createdAt: true, lecture: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      quizzes: {
        select: { id: true, title: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      enrollments: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
    },
  })

  if (!moduleRecord) redirect("/lecturer/modules")

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <p className={ui.textLabel}>Lecturer · Module</p>
            <h1 className="text-lg font-semibold">{moduleRecord.code} · {moduleRecord.name}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/lecturer/modules" className={ui.buttonSecondary}>All modules</Link>
            <Link href={`/lecturer/lectures?module=${encodeURIComponent(moduleRecord.code)}`} className={ui.buttonSecondary}>Lectures</Link>
            <Link href={`/lecturer/analogies/upload-slides?module=${encodeURIComponent(moduleRecord.code)}`} className={ui.buttonPrimary}>Upload lecture slides</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className="grid gap-4 md:grid-cols-4 text-sm">
            <div className={ui.cardFull}><p className={ui.textLabel}>Students</p><p className="mt-2 text-2xl font-semibold">{moduleRecord.enrollments.length}</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>Lectures</p><p className="mt-2 text-2xl font-semibold">{moduleRecord.lectures.length}</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>Analogy sets</p><p className="mt-2 text-2xl font-semibold">{moduleRecord.analogySets.length}</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>Quizzes</p><p className="mt-2 text-2xl font-semibold">{moduleRecord.quizzes.length}</p></div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className={ui.cardFull}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className={ui.cardHeader}>Lectures</h2>
                <Link href={`/lecturer/lectures?module=${encodeURIComponent(moduleRecord.code)}`} className={ui.buttonSmall}>View all</Link>
              </div>
              {moduleRecord.lectures.length === 0 ? (
                <p className={ui.textSmall}>No lectures yet. Upload lecture slides to create one.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {moduleRecord.lectures.slice(0, 8).map((lecture) => (
                    <Link key={lecture.id} href={`/lecturer/lectures/${lecture.id}`} className={ui.linkCard}>
                      <p className="font-medium">{lecture.title}</p>
                      <p className="text-xs text-slate-400">
                        {lecture._count.analogySets} analogy sets · {new Date(lecture.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className={ui.cardFull}>
              <h2 className={ui.cardHeader}>Recent analogies</h2>
              {moduleRecord.analogySets.length === 0 ? (
                <p className={ui.textSmall}>No analogies in this module yet.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {moduleRecord.analogySets.map((analogy) => (
                    <Link key={analogy.id} href={`/lecturer/analogies/${analogy.id}`} className={ui.linkCard}>
                      <p className="font-medium">{analogy.title || "Untitled"}</p>
                      <p className="text-xs text-slate-400">
                        {analogy.lecture?.title || "No lecture"} · {new Date(analogy.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
