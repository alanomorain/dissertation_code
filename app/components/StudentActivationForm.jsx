"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import * as ui from "../styles/ui"

export default function StudentActivationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = useMemo(() => searchParams.get("token") || "", [searchParams])

  const [studentNumber, setStudentNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const activateAccount = async (event) => {
    event.preventDefault()
    setError("")

    if (!token) {
      setError("Missing invitation token.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          studentNumber,
          password,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Unable to activate account")
      }

      router.push("/student/login")
      router.refresh()
    } catch (err) {
      setError(err.message || "Unable to activate account")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={activateAccount} className={`${ui.cardFull} space-y-4`}>
      <div>
        <p className={ui.textLabel}>Student invitation</p>
        <h2 className="mt-1 text-xl font-semibold">Activate your account</h2>
        <p className="mt-2 text-sm text-slate-300">
          Set a password to complete your invited student account.
        </p>
      </div>

      <label className="block space-y-2 text-sm">
        <span className="text-slate-300">Student number (optional)</span>
        <input
          type="text"
          value={studentNumber}
          onChange={(event) => setStudentNumber(event.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
      </label>

      <label className="block space-y-2 text-sm">
        <span className="text-slate-300">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          autoComplete="new-password"
          required
        />
      </label>

      <label className="block space-y-2 text-sm">
        <span className="text-slate-300">Confirm password</span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          autoComplete="new-password"
          required
        />
      </label>

      {error ? <p className="text-sm text-amber-300">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className={ui.buttonPrimary}>
          {submitting ? "Activating..." : "Activate account"}
        </button>
        <Link href="/student/login" className={ui.buttonSecondary}>
          Back to sign in
        </Link>
      </div>
    </form>
  )
}
