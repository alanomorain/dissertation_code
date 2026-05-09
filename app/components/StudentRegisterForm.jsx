"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import * as ui from "../styles/ui"

export default function StudentRegisterForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [studentNumber, setStudentNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          studentNumber,
          password,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Unable to create account")
      }

      router.push("/student/login")
      router.refresh()
    } catch (err) {
      setError(err.message || "Unable to create account")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${ui.cardFull} space-y-4`}>
      <div>
        <p className={ui.textLabel}>Student access</p>
        <h2 className="mt-1 text-xl font-semibold">Create account</h2>
        <p className="mt-2 text-sm text-stone-700">
          Create your student account to sign in directly without seeded demo credentials.
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
        <span className="text-stone-700">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
          autoComplete="email"
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
        <span className="text-stone-700">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
          autoComplete="new-password"
          required
        />
      </label>

      <label className="block space-y-2 text-sm">
        <span className="text-stone-700">Confirm password</span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
          autoComplete="new-password"
          required
        />
      </label>

      {error ? <p className="text-sm text-amber-700">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className={ui.buttonPrimary}>
          {submitting ? "Creating account..." : "Create account"}
        </button>
        <Link href="/student/login" className={ui.buttonSecondary}>
          Back to sign in
        </Link>
      </div>
    </form>
  )
}
