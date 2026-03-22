"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import * as ui from "../../../styles/ui"

export default function AnalogyDetailActions({ analogyId, reviewStatus }) {
  const router = useRouter()
  const [working, setWorking] = useState("")
  const [message, setMessage] = useState("")

  const approve = async () => {
    setWorking("approve")
    setMessage("")

    try {
      const res = await fetch("/api/generate-analogies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: analogyId, action: "approve" }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to approve analogy")
      }

      setMessage("Analogy approved.")
      router.refresh()
    } catch (err) {
      setMessage(err.message || "Failed to approve analogy")
    } finally {
      setWorking("")
    }
  }

  const remove = async () => {
    const confirmed = window.confirm("Delete this analogy set? This cannot be undone.")
    if (!confirmed) return

    setWorking("delete")
    setMessage("")

    try {
      const res = await fetch(`/api/analogies/${analogyId}`, { method: "DELETE" })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to delete analogy")
      }

      router.push("/lecturer/analogies")
      router.refresh()
    } catch (err) {
      setMessage(err.message || "Failed to delete analogy")
      setWorking("")
    }
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/lecturer/analogies" className={ui.buttonSecondary}>
          ← Back to list
        </Link>
        <Link href={`/lecturer/analogies/${analogyId}/edit`} className={ui.buttonSecondary}>
          Edit
        </Link>
        <Link href={`/lecturer/analogies/${analogyId}/review`} className={ui.buttonSecondary}>
          Review
        </Link>
        {reviewStatus !== "APPROVED" && (
          <button
            type="button"
            onClick={approve}
            disabled={working !== ""}
            className={`${ui.buttonPrimary} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {working === "approve" ? "Approving..." : "Approve"}
          </button>
        )}
        <button
          type="button"
          onClick={remove}
          disabled={working !== ""}
          className="rounded-lg border border-red-500 px-3 py-2 text-sm text-red-200 hover:bg-red-900/30 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {working === "delete" ? "Deleting..." : "Delete"}
        </button>
      </div>
      {message && <p className="text-xs text-slate-300">{message}</p>}
    </div>
  )
}
