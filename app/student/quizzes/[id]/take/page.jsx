"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
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
            <p className="text-sm text-amber-300">{error || "Quiz unavailable."}</p>
            <Link href="/student/quizzes" className={ui.buttonSecondary}>Back to quizzes</Link>
          </div>
        </section>
      </main>
    )
  }

  const modalQuestion = questions.find((item) => item.id === mediaQuestionId)
  const modalTopicPayload = getTopicPayload(modalQuestion)

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <p className={ui.textLabel}>Student · Quiz</p>
            <h1 className="text-lg font-semibold">{quiz.title}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href={`/student/quizzes/${id}/start`} className={ui.buttonSecondary}>Exit</Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} ${ui.pageSpacing}`}>
          <div className={ui.cardFull}>
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Question {questionIndex + 1} of {questions.length}</span>
              <span>{isFinalQuestion ? "Final question" : "In progress"}</span>
            </div>

            <h2 className="mt-3 text-base font-semibold">{currentQuestion.prompt}</h2>

            <div className="mt-4 space-y-2 text-sm">
              {currentQuestion.options.map((option) => (
                <label key={option.id} className="flex items-center gap-2 rounded-lg border border-slate-800/70 px-3 py-2">
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
                View analogy
              </button>
            </div>

            {error ? <p className="mt-3 text-sm text-amber-300">{error}</p> : null}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => submitCurrentQuestion({ withAnalogy: false })}
                className={ui.buttonPrimary}
              >
                {submitting ? "Saving..." : isFinalQuestion ? "Submit quiz" : "Submit"}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => submitCurrentQuestion({ withAnalogy: true })}
                className={ui.buttonSecondary}
              >
                {isFinalQuestion ? "Submit quiz and view analogy" : "Submit and view analogy"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {mediaModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-100">
                {mediaStage === "ANALOGY" ? "Analogy" : "Video"}
              </h3>
              <button type="button" className={ui.buttonSmall} onClick={closeMediaModal}>Close</button>
            </div>

            {modalTopicPayload ? (
              <div className="space-y-4 text-sm">
                {mediaStage === "ANALOGY" ? (
                  <>
                    <div className={ui.cardInner}>
                      <p className="text-xs text-slate-400">Topic</p>
                      <p className="font-medium text-slate-100">{modalTopicPayload.topic || "Quiz topic"}</p>
                    </div>
                    <div className={ui.cardInner}>
                      <p className="text-xs text-slate-400 mb-1">Analogy</p>
                      <p className="text-slate-200 whitespace-pre-wrap">{modalTopicPayload.analogy || "No analogy is available for this question."}</p>
                    </div>
                    {modalTopicPayload.imageUrl ? (
                      <div className={ui.cardInner}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={modalTopicPayload.imageUrl}
                          alt={modalTopicPayload.topic || "Analogy image"}
                          className="max-h-72 w-full rounded-lg object-cover"
                        />
                      </div>
                    ) : null}
                  </>
                ) : null}

                {mediaStage === "VIDEO" ? (
                  <div className={ui.cardInner}>
                    {modalTopicPayload.videoUrl ? (
                      <video src={modalTopicPayload.videoUrl} controls className="w-full rounded-lg" />
                    ) : (
                      <p className="text-slate-300">No video is linked for this question yet.</p>
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
                      View video
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
                      View analogy
                    </button>
                  ) : null}
                  <button type="button" className={ui.buttonPrimary} onClick={closeMediaModal}>
                    {pendingAdvance ? "Continue" : "Back to question"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-slate-300">No analogy or video has been linked to this question yet.</p>
                <button type="button" className={ui.buttonPrimary} onClick={closeMediaModal}>Continue</button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </main>
  )
}
