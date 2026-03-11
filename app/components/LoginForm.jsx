"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import * as ui from "../styles/ui"

export default function LoginForm({ role, title, redirectTo, subtitle }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const signIn = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Unable to sign in")
      }

      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      setError(err.message || "Sign in failed")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={signIn} className={`${ui.cardFull} space-y-4`}>
      <div>
        <p className={ui.textLabel}>{role.toLowerCase()} access</p>
        <h2 className="mt-1 text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
      </div>

      <label className="block space-y-2 text-sm">
        <span className="text-slate-300">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          autoComplete="email"
          required
        />
      </label>

      <label className="block space-y-2 text-sm">
        <span className="text-slate-300">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          autoComplete="current-password"
          required
        />
      </label>

      {error ? <p className="text-sm text-amber-300">{error}</p> : null}

      <button type="submit" disabled={submitting} className={ui.buttonPrimary}>
        {submitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  )
}
