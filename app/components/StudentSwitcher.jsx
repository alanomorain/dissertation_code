"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function StudentSwitcher({ currentEmail, students }) {
  const router = useRouter()
  const [email, setEmail] = useState(currentEmail || "")
  const [loading, setLoading] = useState(false)

  const updateStudent = async (nextEmail) => {
    setEmail(nextEmail)
    setLoading(true)

    try {
      const res = await fetch("/api/student-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nextEmail || null }),
      })

      if (!res.ok) throw new Error("Unable to switch")

      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <select
      value={email}
      disabled={loading}
      onChange={(event) => updateStudent(event.target.value)}
      className="rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-200 outline-none focus:border-indigo-400"
    >
      {students.map((student) => (
        <option key={student.id} value={student.email}>
          {student.studentNumber ? `${student.studentNumber} · ` : ""}
          {student.email}
        </option>
      ))}
    </select>
  )
}
