import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { prisma } from "../../../lib/db"
import { getCurrentUser } from "../../../lib/currentUser"
import * as ui from "../../../styles/ui"

export default async function StudentAnalogyDetailPage({ params }) {
  const { id } = await params
  const studentUser = await getCurrentUser("STUDENT", { id: true })

  if (!studentUser) redirect("/student/login")

  const analogy = await prisma.analogySet.findFirst({
    where: {
      id,
      status: "ready",
      reviewStatus: "APPROVED",
      module: {
        enrollments: {
          some: {
            userId: studentUser.id,
            status: "ACTIVE",
          },
        },
      },
    },
  })

  if (!analogy) {
    notFound()
  }

  await prisma.analogyInteraction.create({
    data: {
      analogySetId: analogy.id,
      userId: studentUser.id,
      type: "VIEW",
    },
  })

  const topics =
    analogy.topicsJson !== null && analogy.topicsJson !== undefined && typeof analogy.topicsJson === "object"
      ? analogy.topicsJson.topics || []
      : []

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student · Analogy</p>
            <h1 className="text-lg font-semibold">{analogy.title || "Untitled"}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/student/analogies" className={ui.buttonSecondary}>← Back to library</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <div className="space-y-2 text-sm">
              <div>
                <span className={ui.textMuted}>Source:</span> <span className="text-slate-200">{analogy.source || "N/A"}</span>
              </div>
              <div>
                <span className={ui.textMuted}>Created:</span> <span className="text-slate-200">{new Date(analogy.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {topics.length > 0 ? (
            <div className={ui.cardFull}>
              <h3 className={ui.cardHeader}>Topics & Analogies</h3>
              <div className="space-y-4">
                {topics.map((item, index) => (
                  <div key={index} className={ui.cardInner}>
                    <h4 className="font-medium text-indigo-300 mb-2">{item.topic || "Unknown Topic"}</h4>
                    <p className="text-sm text-slate-300">{item.analogy || "No analogy provided"}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={ui.cardFull}>
              <p className={ui.textSmall}>No topics and analogies available.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
