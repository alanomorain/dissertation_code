"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DeleteLectureButton({ lectureId, lectureTitle }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete lecture "${lectureTitle || "Untitled"}"? Linked analogies and quizzes will be unlinked from this lecture.`,
    )
    if (!confirmed) return

    setDeleting(true)

    try {
      const res = await fetch(`/api/lectures/${lectureId}`, { method: "DELETE" })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to delete lecture")
      }
      router.refresh()
    } catch (err) {
      window.alert(err.message || "Failed to delete lecture")
      setDeleting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-md border border-red-500 px-2 py-1 text-xs text-red-200 hover:bg-red-900/30 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  )
}
