"use client"

import { useState } from "react"
import { formatDisplayDate } from "../lib/dateFormat"
import { getModuleDisplayName } from "../lib/moduleDisplay"
import * as ui from "../styles/ui"

export default function LecturerInviteStudentForm({ modules, initialModuleCode }) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [studentNumber, setStudentNumber] = useState("")
  const [moduleCode, setModuleCode] = useState(
    initialModuleCode && modules.some((module) => module.code === initialModuleCode)
      ? initialModuleCode
      : (modules[0]?.code || ""),
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState(null)

  const inviteStudent = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/lecturer/students/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, studentNumber, moduleCode }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Unable to invite student")
      }

      setResult(data)
      setFullName("")
      setEmail("")
      setStudentNumber("")
      setSubmitting(false)
    } catch (err) {
      setError(err.message || "Unable to invite student")
      setSubmitting(false)
    }
  }

  if (modules.length === 0) {
    return (
      <div className={ui.cardFull}>
        <p className={ui.textSmall}>
          You need at least one module before inviting students.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <form onSubmit={inviteStudent} className={`${ui.cardFull} space-y-4`}>
        <div>
          <p className={ui.textLabel}>Lecturer tools</p>
          <h2 className="mt-1 text-xl font-semibold">Invite a student</h2>
          <p className="mt-2 text-sm text-stone-700">
            Invite a student to a module. They will receive an activation link.
          </p>
        </div>

        <label className="block space-y-2 text-sm">
          <span className="text-stone-700">Full name</span>
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="text-stone-700">Student email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
            required
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="text-stone-700">Student number (optional)</span>
          <input
            type="text"
            value={studentNumber}
            onChange={(event) => setStudentNumber(event.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="text-stone-700">Module</span>
          <select
            value={moduleCode}
            onChange={(event) => setModuleCode(event.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
            required
          >
            {modules.map((module) => (
              <option key={module.id} value={module.code}>
                {getModuleDisplayName(module)}
              </option>
            ))}
          </select>
        </label>

        {error ? <p className="text-sm text-amber-700">{error}</p> : null}

        <button type="submit" disabled={submitting} className={ui.buttonPrimary}>
          {submitting ? "Creating invite..." : "Create invite"}
        </button>
      </form>

      {result ? (
        <div className={ui.cardFull}>
          <h3 className={ui.cardHeader}>Invite created</h3>
          <p className="text-sm text-stone-700">Share this activation link with {result.email}:</p>
          <p className="mt-2 break-all rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-800">
            {result.activationLink}
          </p>
          <p className="mt-2 text-xs text-stone-600">
            Expires: {formatDisplayDate(result.expiresAt)}
          </p>
        </div>
      ) : null}
    </div>
  )
}
