import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "../../../lib/db"
import { getCurrentUser } from "../../../lib/currentUser"
import * as ui from "../../../styles/ui"

export default async function LecturerLectureDetailPage({ params }) {
  const lecturer = await getCurrentUser("LECTURER", { id: true })
  if (!lecturer) redirect("/lecturer/login")

  const { id } = await params

  const lecture = await prisma.lecture.findFirst({
    where: {
      id,
      ownerId: lecturer.id,
    },
    include: {
      module: { select: { code: true, name: true } },
      analogySets: {
        select: {
          id: true,
          lecture: { select: { title: true } },
          title: true,
          status: true,
          reviewStatus: true,
          createdAt: true,
          topicsJson: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!lecture) redirect("/lecturer/lectures")

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <p className={ui.textLabel}>Lecturer · Lecture</p>
            <h1 className="text-lg font-semibold">{lecture.title}</h1>
            <p className={ui.textSmall}>{lecture.module.code} · {lecture.module.name}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/lecturer/lectures" className={ui.buttonSecondary}>Back to Lectures</Link>
            <Link href={`/lecturer/modules/${encodeURIComponent(lecture.module.code)}`} className={ui.buttonSecondary}>Open module</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <p className={ui.textLabel}>Analogy sets from this lecture</p>
            <p className="mt-1 text-2xl font-semibold">{lecture.analogySets.length}</p>
          </div>

          <div className={ui.cardFull}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className={ui.cardHeader}>Analogies</h2>
              <Link
                href={`/lecturer/analogies/upload-slides?module=${encodeURIComponent(lecture.module.code)}&lectureId=${encodeURIComponent(lecture.id)}`}
                className={ui.buttonPrimary}
              >
                Create Analogy Set
              </Link>
            </div>
            {lecture.analogySets.length === 0 ? (
              <p className={ui.textSmall}>No analogies linked to this lecture yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {lecture.analogySets.map((analogy, index) => {
                  const topicCount = Array.isArray(analogy.topicsJson?.topics) ? analogy.topicsJson.topics.length : 0

                  return (
                    <Link key={analogy.id} href={`/lecturer/analogies/${analogy.id}`} className={ui.linkCard}>
                      <p className="font-medium">Set {index + 1}</p>
                      <p className="text-xs text-stone-600">
                        Status: {analogy.status} · Review: {(analogy.reviewStatus || "DRAFT").toLowerCase()} · {new Date(analogy.createdAt).toLocaleDateString()}
                        {topicCount > 0 ? ` · ${topicCount} ${topicCount === 1 ? "topic" : "topics"}` : ""}
                      </p>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
