import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "../../../../lib/db"
import { getCurrentUser } from "../../../../lib/currentUser"
import * as ui from "../../../../styles/ui"
import StudentPageHeader from "../../../components/StudentPageHeader"

function getQuestionDisplayPrompt(question, quizTitle) {
  const prompt = String(question?.prompt || "").trim()
  const title = String(quizTitle || "").trim()

  if (!prompt || !title) return prompt

  const prefix = `(${title})`
  return prompt.startsWith(prefix) ? prompt.slice(prefix.length).trim() : prompt
}

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
  const attemptId = String((await searchParams).attemptId || "").trim()
  if (!attemptId) notFound()

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

  const submittedAttempts = await prisma.quizAttempt.count({
    where: {
      quizId: id,
      studentId: studentUser.id,
      status: "SUBMITTED",
    },
  })

  const gradedResponses = attempt.responses.filter((r) => typeof r.isCorrect === "boolean")
  const orderedResponses = [...attempt.responses].sort(
    (a, b) => (a.question?.orderIndex || 0) - (b.question?.orderIndex || 0),
  )
  const correct = gradedResponses.filter((r) => r.isCorrect).length
  const scoreFromResponses = gradedResponses.length
    ? Math.round((correct / gradedResponses.length) * 100)
    : (attempt.score || 0)
  const submittedDate = attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : "N/A"
  const dueDate = attempt.quiz.dueAt ? new Date(attempt.quiz.dueAt).toLocaleDateString() : "Any time"
  const remainingAttempts = Math.max(0, (attempt.quiz.maxAttempts || 1) - submittedAttempts)

  return (
    <main className={ui.page}>
      <StudentPageHeader
        label="Student · Results"
        title="Your results"
        subtitle={attempt.quiz.title}
        actions={<Link href="/student/quizzes" className={ui.buttonSecondary}>All Quizzes</Link>}
      />

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <div className={ui.cardFull}><p className={ui.textLabel}>Score</p><p className="mt-2 text-2xl font-semibold">{scoreFromResponses}%</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>Auto-graded</p><p className="mt-2 text-2xl font-semibold">{correct}/{gradedResponses.length}</p></div>
            <div className={ui.cardFull}>
              <p className={ui.textLabel}>Submitted</p>
              <p className="mt-2 text-2xl font-semibold">{submittedDate}</p>
            </div>
            <div className={ui.cardFull}><p className={ui.textLabel}>Remaining attempts</p><p className="mt-2 text-2xl font-semibold">{remainingAttempts}</p></div>
            <div className={ui.cardFull}><p className={ui.textLabel}>Due date</p><p className="mt-2 text-2xl font-semibold">{dueDate}</p></div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Quiz Summary</h2>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <p><span className={ui.textMuted}>Quiz:</span> {attempt.quiz.title}</p>
              <p><span className={ui.textMuted}>Score:</span> {scoreFromResponses}%</p>
              <p><span className={ui.textMuted}>Auto-graded:</span> {correct} / {gradedResponses.length}</p>
              <p><span className={ui.textMuted}>Submitted:</span> {submittedDate}</p>
            </div>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Your Answers</h2>
            <div className="space-y-3 text-sm">
              {orderedResponses.map((response) => (
                <div key={response.id} className={ui.cardInner}>
                  <p className="text-stone-800">{getQuestionDisplayPrompt(response.question, attempt.quiz.title)}</p>
                  <p className="mt-1 text-xs text-stone-600">
                    Your answer: {response.selectedOption?.text || "No option selected"} · {response.isCorrect ? "Correct" : "Incorrect"}
                  </p>
                  {(() => {
                    const topicPayload = getTopicPayload(response.question)
                    if (!topicPayload || (!topicPayload.analogy && !topicPayload.videoUrl)) return null

                    return (
                      <details className="mt-2 rounded-lg border border-stone-200 bg-white p-3">
                        <summary className="cursor-pointer text-xs font-medium text-teal-700">
                          View linked analogy and media
                        </summary>
                        <div className="mt-2 space-y-3">
                          {topicPayload.topic ? (
                            <p className="text-xs text-stone-700">
                              <span className={ui.textMuted}>Topic:</span> {topicPayload.topic}
                            </p>
                          ) : null}
                          {topicPayload.analogy ? (
                            <p className="text-sm text-stone-800 whitespace-pre-wrap">{topicPayload.analogy}</p>
                          ) : null}
                          {topicPayload.imageUrl ? (
                            <div className="aspect-[4/3] w-full overflow-hidden rounded-lg">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={topicPayload.imageUrl}
                                alt={topicPayload.topic || "Analogy image"}
                                className="h-full w-full object-cover"
                              />
                            </div>
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
            <Link href={`/student/quizzes/${id}/start`} className={ui.buttonPrimary}>Retake Quiz</Link>
            <Link href="/student/quizzes" className={ui.buttonSecondary}>All Quizzes</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
