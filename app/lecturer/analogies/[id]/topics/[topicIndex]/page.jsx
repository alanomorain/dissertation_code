import Link from "next/link"
import { prisma } from "../../../../../lib/db"
import { notFound } from "next/navigation"
import * as ui from "../../../../../styles/ui"
import MediaImagePanel from "../../../components/MediaImagePanel"

export default async function LecturerTopicDetailPage({ params }) {
  const { id, topicIndex } = await params

  const analogy = await prisma.analogySet.findUnique({
    where: { id },
  })

  if (!analogy) {
    notFound()
  }

  let topics = []
  if (analogy.topicsJson && typeof analogy.topicsJson === "object") {
    topics = analogy.topicsJson.topics || []
  }

  const index = Number(topicIndex)
  if (Number.isNaN(index) || index < 0 || index >= topics.length) {
    notFound()
  }

  const topic = topics[index] || {}
  const prevIndex = index > 0 ? index - 1 : null
  const nextIndex = index < topics.length - 1 ? index + 1 : null

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <p className={ui.textLabel}>Lecturer · Topic</p>
            <h1 className="text-lg font-semibold">
              {analogy.title || "Analogy"}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {prevIndex !== null && (
              <Link
                href={`/lecturer/analogies/${id}/topics/${prevIndex}`}
                className={ui.buttonSecondary}
              >
                ← Previous topic
              </Link>
            )}
            <Link
              href={`/lecturer/analogies/${id}`}
              className={ui.buttonSecondary}
            >
              ← Back to analogy
            </Link>
            {nextIndex !== null && (
              <Link
                href={`/lecturer/analogies/${id}/topics/${nextIndex}`}
                className={ui.buttonSecondary}
              >
                Next topic →
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <h2 className="text-xl font-semibold mb-2">
              {topic.topic || "Unknown Topic"}
            </h2>
            <p className="text-sm text-slate-300">
              {topic.analogy || "No analogy provided"}
            </p>

            <MediaImagePanel
              analogyText={topic.analogy || ""}
              topicTitle={topic.topic || ""}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
