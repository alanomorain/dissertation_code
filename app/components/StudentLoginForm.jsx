"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import * as ui from "../styles/ui"

export default function StudentLoginForm({ students, selectedEmail }) {
  const router = useRouter()
  const [email, setEmail] = useState(selectedEmail || students[0]?.email || "")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const signIn = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/student-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) throw new Error("Unable to sign in")
      router.push("/student")
      router.refresh()
    } catch (err) {
      setError(err.message || "Sign in failed")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={signIn} className={`${ui.cardFull} space-y-4`}>
      <div>
        <p className={ui.textLabel}>Student login</p>
        <h2 className="mt-1 text-xl font-semibold">Choose a student profile</h2>
      </div>

      <label className="block space-y-2 text-sm">
        <span className="text-slate-300">Student account</span>
        <select
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        >
          {students.map((student) => (
            <option key={student.id} value={student.email}>
              {student.studentNumber ? `${student.studentNumber} · ` : ""}
              {student.email}
            </option>
          ))}
        </select>
      </label>

      {error ? <p className="text-sm text-amber-300">{error}</p> : null}

      <button
        type="submit"
        disabled={!email || submitting}
        className={ui.buttonPrimary}
      >
        {submitting ? "Signing in..." : "Sign in as student"}
      </button>
    </form>
  )
}
