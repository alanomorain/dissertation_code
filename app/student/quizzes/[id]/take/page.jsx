"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import * as ui from "../../../../styles/ui"

export default function StudentQuizTakePage({ params }) {
  const { id } = params
  const router = useRouter()
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/quizzes/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setQuiz(data))
      .catch(() => setQuiz(null))
  }, [id])

  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const submit = async () => {
    if (!quiz) return
    setSubmitting(true)
    setError("")
    try {
      const payload = {
        responses: quiz.questions.map((q) => ({
          questionId: q.id,
          selectedOptionId: q.type === "MCQ" ? answers[q.id] || null : null,
          textAnswer: q.type === "SHORT" ? (answers[q.id] || "") : "",
        })),
      }

      const res = await fetch(`/api/quizzes/${id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Unable to submit")

      router.push(`/student/quizzes/${id}/results?attemptId=${encodeURIComponent(data.attemptId)}`)
    } catch (err) {
      setError(err.message || "Submission failed")
      setSubmitting(false)
    }
  }

  if (!quiz) {
    return <main className={ui.page}><section className={ui.pageSection}><div className={`${ui.containerNarrow} py-8`}><p>Loading quiz...</p></div></section></main>
  }

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
          {quiz.questions.map((question, index) => (
            <div key={question.id} className={ui.cardFull}>
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Question {index + 1} of {quiz.questions.length}</span>
              </div>
              <h2 className="mt-3 text-base font-semibold">{question.prompt}</h2>
              {question.type === "MCQ" ? (
                <div className="mt-4 space-y-2 text-sm">
                  {question.options.map((option) => (
                    <label key={option.id} className="flex items-center gap-2">
                      <input type="radio" name={question.id} checked={answers[question.id] === option.id} onChange={() => setAnswer(question.id, option.id)} />
                      <span>{option.text}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea rows={3} value={answers[question.id] || ""} onChange={(e) => setAnswer(question.id, e.target.value)} className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" />
              )}
            </div>
          ))}

          {error ? <p className="text-sm text-amber-300">{error}</p> : null}
          <div className="flex items-center justify-end">
            <button type="button" disabled={submitting} onClick={submit} className={ui.buttonPrimary}>
              {submitting ? "Submitting..." : "Submit quiz"}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
