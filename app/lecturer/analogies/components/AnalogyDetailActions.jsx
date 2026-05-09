"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import * as ui from "../../../styles/ui"

export default function AnalogyDetailActions({ analogyId, returnHref = "/lecturer/lectures" }) {
  const router = useRouter()
  const [working, setWorking] = useState("")
  const [message, setMessage] = useState("")

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
        <Link href={returnHref} className={ui.buttonSecondary}>
          Return to Lecture
        </Link>
        <Link href={`/lecturer/analogies/${analogyId}/review`} className={ui.buttonSecondary}>
          Review
        </Link>
        <button
          type="button"
          onClick={remove}
          disabled={working !== ""}
          className="rounded-lg border border-red-500 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {working === "delete" ? "Deleting..." : "Delete"}
        </button>
      </div>
      {message && <p className="text-xs text-stone-700">{message}</p>}
    </div>
  )
}
