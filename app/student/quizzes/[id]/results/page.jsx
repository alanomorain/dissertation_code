import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "../../../../lib/db"
import { getCurrentUser } from "../../../../lib/currentUser"
import * as ui from "../../../../styles/ui"

function getTopicPayload(question) {
  const topicIndex = Number(question?.analogyTopicIndex)
  const topics = Array.isArray(question?.analogySet?.topicsJson?.topics)
    ? question.analogySet.topicsJson.topics
    : []

  if (!Number.isInteger(topicIndex) || topicIndex < 0 || topicIndex >= topics.length) {
    return null
  }

  const topic = topics[topicIndex] || {}
  return {
    topic: String(topic?.topic || "").trim(),
    analogy: String(topic?.analogy || "").trim(),
    imageUrl: String(topic?.imageUrl || "").trim(),
    videoUrl: String(question?.videoUrl || topic?.videoUrl || "").trim(),
  }
}

export default async function StudentQuizResultsPage({ params, searchParams }) {
  const { id } = await params
  const attemptId = (await searchParams).attemptId
  const studentUser = await getCurrentUser("STUDENT", { id: true })
  if (!studentUser) notFound()

  const attempt = await prisma.quizAttempt.findFirst({
    where: {
      id: attemptId || undefined,
      quizId: id,
      studentId: studentUser.id,
      status: "SUBMITTED",
    },
    include: {
      quiz: true,
      responses: {
        include: {
          question: {
            include: {
              options: {
                orderBy: { orderIndex: "asc" },
              },
              analogySet: {
                select: {
                  id: true,
                  topicsJson: true,
                },
              },
            },
          },
          selectedOption: {
            select: { id: true, text: true },
          },
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  })

  if (!attempt) notFound()

  const gradedResponses = attempt.responses.filter((r) => typeof r.isCorrect === "boolean")
  const orderedResponses = [...attempt.responses].sort(
    (a, b) => (a.question?.orderIndex || 0) - (b.question?.orderIndex || 0),
  )
  const correct = gradedResponses.filter((r) => r.isCorrect).length
  const scoreFromResponses = gradedResponses.length
    ? Math.round((correct / gradedResponses.length) * 100)
    : (attempt.score || 0)

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student · Results</p>
            <h1 className="text-lg font-semibold">Your results</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/student/quizzes" className={ui.buttonSecondary}>Back to quizzes</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Quiz summary</h2>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <p><span className={ui.textMuted}>Quiz:</span> {attempt.quiz.title}</p>
              <p><span className={ui.textMuted}>Score:</span> {scoreFromResponses}%</p>
              <p><span className={ui.textMuted}>Auto-graded:</span> {correct} / {gradedResponses.length}</p>
              <p><span className={ui.textMuted}>Submitted:</span> {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "N/A"}</p>
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Question feedback</h2>
            <div className="space-y-3 text-sm">
              {orderedResponses.map((response) => (
                <div key={response.id} className={ui.cardInner}>
                  <p className="text-slate-200">{response.question.prompt}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Your answer: {response.selectedOption?.text || "No option selected"} · {response.isCorrect ? "Correct" : "Incorrect"}
                  </p>
                  {(() => {
                    const topicPayload = getTopicPayload(response.question)
                    if (!topicPayload || (!topicPayload.analogy && !topicPayload.videoUrl)) return null

                    return (
                      <details className="mt-2 rounded-lg border border-slate-800/70 bg-slate-900/70 p-3">
                        <summary className="cursor-pointer text-xs font-medium text-indigo-300">
                          View linked analogy and media
                        </summary>
                        <div className="mt-2 space-y-3">
                          {topicPayload.topic ? (
                            <p className="text-xs text-slate-300">
                              <span className={ui.textMuted}>Topic:</span> {topicPayload.topic}
                            </p>
                          ) : null}
                          {topicPayload.analogy ? (
                            <p className="text-sm text-slate-200 whitespace-pre-wrap">{topicPayload.analogy}</p>
                          ) : null}
                          {topicPayload.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={topicPayload.imageUrl}
                              alt={topicPayload.topic || "Analogy image"}
                              className="max-h-64 w-full rounded-lg object-cover"
                            />
                          ) : null}
                          {topicPayload.videoUrl ? (
                            <video src={topicPayload.videoUrl} controls className="w-full rounded-lg" />
                          ) : null}
                        </div>
                      </details>
                    )
                  })()}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/student/quizzes/${id}/start`} className={ui.buttonPrimary}>Retake quiz</Link>
            <Link href="/student/quizzes" className={ui.buttonSecondary}>Return to quizzes</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
