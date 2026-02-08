"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import * as ui from "../../../../styles/ui"

const formatDateTime = (value) => {
  if (!value) return "Not approved"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not approved"
  return date.toLocaleString()
}

export default function LecturerAnalogyReviewPage() {
  const params = useParams()
  const id = params.id

  const [analogy, setAnalogy] = useState(null)
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [working, setWorking] = useState("")

  const reviewStatus = analogy?.reviewStatus || "DRAFT"
  const approvedAt = useMemo(() => formatDateTime(analogy?.approvedAt), [analogy?.approvedAt])

  const loadAnalogy = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/analogies/${id}`)
      if (!res.ok) {
        throw new Error("Failed to load analogy")
      }
      const data = await res.json()
      const nextTopics = (data.topicsJson?.topics || []).map((item) => ({
        topic: item.topic || "",
        analogy: item.analogy || "",
        feedback: item.feedback || "",
      }))
      setAnalogy(data)
      setTopics(nextTopics)
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to load analogy" })
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadAnalogy()
  }, [loadAnalogy])

  const updateFeedback = (index, value) => {
    setTopics((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, feedback: value } : item,
      ),
    )
  }

  const runAction = async (action, payload = {}) => {
    setWorking(action)
    setMessage(null)

    try {
      const res = await fetch("/api/generate-analogies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...payload }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Request failed")
      }

      const data = await res.json()

      if (action === "approve") {
        setAnalogy((prev) => ({
          ...prev,
          reviewStatus: data.reviewStatus || "APPROVED",
          approvedAt: data.approvedAt || new Date().toISOString(),
        }))
        setMessage({ type: "success", text: "Analogy approved." })
      }

      if (action === "requestChanges") {
        setAnalogy((prev) => ({
          ...prev,
          reviewStatus: data.reviewStatus || "CHANGES",
          approvedAt: null,
        }))
        setMessage({ type: "success", text: "Changes requested." })
      }

      if (action === "updateFeedback") {
        setMessage({ type: "success", text: "Feedback saved." })
      }

      if (action === "regenerate") {
        await loadAnalogy()
        setMessage({ type: "success", text: "Analogies regenerated." })
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Action failed" })
    } finally {
      setWorking("")
    }
  }

  const handleSaveFeedback = async () => {
    await runAction("updateFeedback", { topics })
  }

  const handleRequestChanges = async () => {
    await runAction("requestChanges", { topics })
  }

  const handleApprove = async () => {
    await runAction("approve")
  }

  const handleRegenerate = async () => {
    await runAction("regenerate")
  }

  if (loading) {
    return (
      <main className={ui.page}>
        <section className={ui.pageSection}>
          <div className={`${ui.container} ${ui.pageSpacing}`}>
            <div className={ui.cardFull}>Loading review...</div>
          </div>
        </section>
      </main>
    )
  }

  if (!analogy) {
    return (
      <main className={ui.page}>
        <section className={ui.pageSection}>
          <div className={`${ui.container} ${ui.pageSpacing}`}>
            <div className={ui.cardFull}>Analogy not found.</div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerContent}>
          <div>
            <h1 className="text-lg font-semibold">Review Analogy</h1>
            <p className={ui.textSmall}>{analogy.title || "Untitled"}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href={`/lecturer/analogies/${id}`} className={ui.buttonSecondary}>
              Back to details
            </Link>
          </div>
        </div>
      </header>

      <section className={ui.pageSection}>
        <div className={`${ui.container} ${ui.pageSpacing}`}>
          {message && (
            <div
              className={`rounded-xl border px-3 py-2 text-sm ${
                message.type === "error"
                  ? "border-red-600 bg-red-900/30 text-red-100"
                  : "border-emerald-500 bg-emerald-900/30 text-emerald-100"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className={ui.cardFull}>
            <div className="flex flex-wrap items-center gap-3">
              <span className={ui.getBadgeClass(analogy.status)}>{analogy.status}</span>
              <span className={ui.getReviewBadgeClass(reviewStatus)}>
                {reviewStatus.toLowerCase()}
              </span>
              <span className="text-xs text-slate-400">
                Approved at: {approvedAt}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              Feedback is lecturer-only and will not be shown to students.
            </p>
          </div>

          <div className={ui.cardFull}>
            <h2 className={ui.cardHeader}>Topics & Feedback</h2>
            {topics.length === 0 ? (
              <p className={ui.textSmall}>No topics available.</p>
            ) : (
              <div className="space-y-4">
                {topics.map((item, index) => (
                  <div key={`${item.topic}-${index}`} className={ui.cardInner}>
                    <h3 className="text-sm font-semibold text-indigo-300 mb-2">
                      {item.topic || "Untitled topic"}
                    </h3>
                    <p className="text-sm text-slate-200 mb-3">{item.analogy || ""}</p>
                    <label className="text-xs uppercase tracking-wide text-slate-400">
                      Feedback
                    </label>
                    <textarea
                      value={item.feedback}
                      onChange={(event) => updateFeedback(index, event.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                      placeholder="Add feedback for this topic"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSaveFeedback}
              disabled={working !== ""}
              className={ui.buttonSecondary}
            >
              {working === "updateFeedback" ? "Saving..." : "Save feedback"}
            </button>
            <button
              type="button"
              onClick={handleRequestChanges}
              disabled={working !== ""}
              className={ui.buttonSecondary}
            >
              {working === "requestChanges" ? "Sending..." : "Request changes"}
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={working !== ""}
              className={ui.buttonPrimary}
            >
              {working === "approve" ? "Approving..." : "Approve"}
            </button>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={working !== ""}
              className={ui.buttonSecondary}
            >
              {working === "regenerate" ? "Regenerating..." : "Regenerate"}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
