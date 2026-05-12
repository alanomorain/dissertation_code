"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { formatDisplayDate } from "../../../../lib/dateFormat"
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
    analogySetId: question.analogySet?.id || null,
    topic: String(topic?.topic || "").trim(),
    analogy: String(topic?.analogy || "").trim(),
    imageUrl: String(topic?.imageUrl || "").trim(),
    videoUrl: String(question?.videoUrl || topic?.videoUrl || "").trim(),
  }
}

export default function StudentQuizTakePage() {
  const { id } = useParams()
  const router = useRouter()

  const [quiz, setQuiz] = useState(null)
  const [attemptId, setAttemptId] = useState("")
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loadingQuiz, setLoadingQuiz] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [mediaModalOpen, setMediaModalOpen] = useState(false)
  const [mediaStage, setMediaStage] = useState("ANALOGY")
  const [mediaQuestionId, setMediaQuestionId] = useState("")
  const [pendingAdvance, setPendingAdvance] = useState(null)

  const questions = quiz?.questions || []
  const currentQuestion = questions[questionIndex] || null
  const isFinalQuestion = questionIndex === questions.length - 1
  const progressPercent = questions.length > 0
    ? Math.max(0, Math.min(99, Math.round((questionIndex / questions.length) * 100)))
    : 0

  const openMediaModal = async ({ questionId, autoAdvance }) => {
    const question = questions.find((item) => item.id === questionId)
    const payload = getTopicPayload(question)

    if (!payload || (!payload.analogy && !payload.videoUrl)) {
      if (autoAdvance) {
        if (autoAdvance.isFinal) {
          await finishAttempt()
        } else if (autoAdvance.nextQuestionId) {
          const nextIndex = questions.findIndex((item) => item.id === autoAdvance.nextQuestionId)
          if (nextIndex >= 0) setQuestionIndex(nextIndex)
        }
      }
      return
    }

    setMediaQuestionId(questionId)
    setPendingAdvance(autoAdvance || null)

    const stage = payload.analogy ? "ANALOGY" : "VIDEO"
    setMediaStage(stage)
    setMediaModalOpen(true)

    if (stage === "ANALOGY") {
      await recordInteraction(questionId, "ANALOGY_VIEW")
    } else if (stage === "VIDEO") {
      await recordInteraction(questionId, "VIDEO_VIEW")
    }
  }

  const closeMediaModal = async () => {
    setMediaModalOpen(false)

    const continuation = pendingAdvance
    setPendingAdvance(null)

    if (!continuation) return

    if (continuation.isFinal) {
      await finishAttempt()
      return
    }

    if (continuation.nextQuestionId) {
      const nextIndex = questions.findIndex((item) => item.id === continuation.nextQuestionId)
      if (nextIndex >= 0) setQuestionIndex(nextIndex)
    }
  }

  const recordInteraction = async (questionId, interactionType) => {
    if (!attemptId || !questionId) return

    await fetch(`/api/quizzes/${id}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "interaction",
        attemptId,
        questionId,
        interactionType,
      }),
    }).catch(() => null)
  }

  const finishAttempt = async () => {
    if (!attemptId) return

    try {
      const res = await fetch(`/api/quizzes/${id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finish",
          attemptId,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Unable to submit quiz")

      router.push(`/student/quizzes/${id}/results?attemptId=${encodeURIComponent(data.attemptId)}`)
    } catch (err) {
      setError(err.message || "Unable to submit quiz")
      setSubmitting(false)
    }
  }

  const submitCurrentQuestion = async ({ withAnalogy }) => {
    if (!currentQuestion || !attemptId) return

    setSubmitting(true)
    setError("")

    try {
      const res = await fetch(`/api/quizzes/${id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          attemptId,
          questionId: currentQuestion.id,
          selectedOptionId: answers[currentQuestion.id] || null,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Unable to save answer")

      if (withAnalogy) {
        await openMediaModal({
          questionId: currentQuestion.id,
          autoAdvance: {
            nextQuestionId: data.nextQuestionId,
            isFinal: !data.nextQuestionId,
          },
        })
      } else if (!data.nextQuestionId) {
        await finishAttempt()
        return
      } else {
        const nextIndex = questions.findIndex((item) => item.id === data.nextQuestionId)
        if (nextIndex >= 0) setQuestionIndex(nextIndex)
      }
    } catch (err) {
      setError(err.message || "Unable to save answer")
    } finally {
      setSubmitting(false)
    }
  }

  const saveAndExit = async () => {
    if (!attemptId || !currentQuestion) {
      router.push("/student/quizzes")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const selectedOptionId = answers[currentQuestion.id] || null

      if (selectedOptionId) {
        const res = await fetch(`/api/quizzes/${id}/attempts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "answer",
            attemptId,
            questionId: currentQuestion.id,
            selectedOptionId,
          }),
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || "Unable to save progress")
      }

      router.push("/student/quizzes")
    } catch (err) {
      setError(err.message || "Unable to save progress")
      setSubmitting(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoadingQuiz(true)
      setError("")

      try {
        const quizRes = await fetch(`/api/quizzes/${id}`)
        if (!quizRes.ok) {
          if (!cancelled) {
            if (quizRes.status === 404) {
              setError("This quiz is unavailable or no longer accessible.")
            } else if (quizRes.status === 401) {
              setError("Please sign in to access this quiz.")
            } else {
              setError("Unable to load this quiz right now.")
            }
            setQuiz(null)
          }
          return
        }

        const quizData = await quizRes.json()
        if (cancelled) return
        setQuiz(quizData)

        const startRes = await fetch(`/api/quizzes/${id}/attempts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start" }),
        })
        const startData = await startRes.json().catch(() => ({}))
        if (!startRes.ok) {
          throw new Error(startData.error || "Unable to start attempt")
        }

        if (!cancelled) {
          setAttemptId(startData.attemptId || "")

          const answeredIds = Array.isArray(startData.answeredQuestionIds)
            ? new Set(startData.answeredQuestionIds)
            : new Set()
          const firstUnansweredIndex = quizData.questions.findIndex((question) => !answeredIds.has(question.id))
          setQuestionIndex(firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load this quiz right now.")
          setQuiz(null)
        }
      } finally {
        if (!cancelled) {
          setLoadingQuiz(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [id])

  if (loadingQuiz) {
    return (
      <main className={ui.page}>
        <section className={ui.pageSection}>
          <div className={`${ui.containerNarrow} py-8`}>
            <p>Loading quiz...</p>
          </div>
        </section>
      </main>
    )
  }

  if (!quiz || !currentQuestion) {
    return (
      <main className={ui.page}>
        <section className={ui.pageSection}>
          <div className={`${ui.containerNarrow} py-8 space-y-3`}>
            <p className="text-sm text-amber-700">{error || "Quiz unavailable."}</p>
            <Link href="/student/quizzes" className={ui.buttonSecondary}>Back to Quizzes</Link>
          </div>
        </section>
      </main>
    )
  }

  const modalQuestion = questions.find((item) => item.id === mediaQuestionId)
  const modalTopicPayload = getTopicPayload(modalQuestion)

  return (
    <main className={ui.page}>
      <StudentPageHeader
        label="Student · Quiz"
        title={quiz.title}
        subtitle={`Due: ${formatDisplayDate(quiz.dueAt, "No due date")}`}
        actions={
          <button type="button" className={ui.buttonSecondary} disabled={submitting} onClick={saveAndExit}>
            {submitting ? "Saving..." : "Save & Exit"}
          </button>
        }
      />

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <div className="mb-4">
              <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <h2 className="text-base font-semibold">{getQuestionDisplayPrompt(currentQuestion, quiz.title)}</h2>

            <div className="mt-4 space-y-2 text-sm">
              {currentQuestion.options.map((option) => (
                <label key={option.id} className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2">
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    checked={answers[currentQuestion.id] === option.id}
                    onChange={() => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option.id }))}
                  />
                  <span>{option.text}</span>
                </label>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={ui.buttonSecondary}
                onClick={() => openMediaModal({ questionId: currentQuestion.id, autoAdvance: null })}
              >
                View Analogy
              </button>
            </div>

            {error ? <p className="mt-3 text-sm text-amber-700">{error}</p> : null}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => submitCurrentQuestion({ withAnalogy: false })}
                className={ui.buttonPrimary}
              >
                {submitting ? "Saving..." : isFinalQuestion ? "Submit Quiz" : "Submit"}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => submitCurrentQuestion({ withAnalogy: true })}
                className={ui.buttonSecondary}
              >
                {isFinalQuestion ? "Submit Quiz and View Analogy" : "Submit and View Analogy"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {mediaModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-stone-300 bg-white p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-stone-950">
                {mediaStage === "ANALOGY" ? "Analogy" : "Video"}
              </h3>
              <button type="button" className={ui.buttonSmall} onClick={closeMediaModal}>Close</button>
            </div>

            {modalTopicPayload ? (
              <div className="space-y-4 text-sm">
                {mediaStage === "ANALOGY" ? (
                  <>
                    <div className={ui.cardInner}>
                      <p className="text-xs text-stone-600">Topic</p>
                      <p className="font-medium text-stone-950">{modalTopicPayload.topic || "Quiz topic"}</p>
                    </div>
                    <div className={ui.cardInner}>
                      <p className="text-xs text-stone-600 mb-1">Analogy</p>
                      <p className="text-stone-800 whitespace-pre-wrap">{modalTopicPayload.analogy || "No analogy is available for this question."}</p>
                    </div>
                    {modalTopicPayload.imageUrl ? (
                      <div className={ui.cardInner}>
                        <div className="aspect-[4/3] w-full overflow-hidden rounded-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={modalTopicPayload.imageUrl}
                            alt={modalTopicPayload.topic || "Analogy image"}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : null}

                {mediaStage === "VIDEO" ? (
                  <div className={ui.cardInner}>
                    {modalTopicPayload.videoUrl ? (
                      <video src={modalTopicPayload.videoUrl} controls className="w-full rounded-lg" />
                    ) : (
                      <p className="text-stone-700">No video is linked for this question yet.</p>
                    )}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {modalTopicPayload.videoUrl ? (
                    <button
                      type="button"
                      className={ui.buttonSecondary}
                      onClick={async () => {
                        if (mediaStage !== "VIDEO") {
                          await recordInteraction(mediaQuestionId, "VIDEO_VIEW")
                        }
                        setMediaStage("VIDEO")
                      }}
                    >
                      View Video
                    </button>
                  ) : null}
                  {modalTopicPayload.analogy ? (
                    <button
                      type="button"
                      className={ui.buttonSecondary}
                      onClick={async () => {
                        if (mediaStage !== "ANALOGY") {
                          await recordInteraction(mediaQuestionId, "ANALOGY_VIEW")
                        }
                        setMediaStage("ANALOGY")
                      }}
                    >
                      View Analogy
                    </button>
                  ) : null}
                  <button type="button" className={ui.buttonPrimary} onClick={closeMediaModal}>
                    {pendingAdvance ? "Continue" : "Back to Question"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-stone-700">No analogy or video has been linked to this question yet.</p>
                <button type="button" className={ui.buttonPrimary} onClick={closeMediaModal}>Continue</button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </main>
  )
}
