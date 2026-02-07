"use client"

import { useEffect, useState } from "react"

const ROLE_OPTIONS = [
  { value: "STUDENT", label: "Student" },
  { value: "LECTURER", label: "Lecturer" },
  { value: "ADMIN", label: "Admin" },
]

export default function DemoRoleSwitcher() {
  const [currentRole, setCurrentRole] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const match = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("demo-role="))

    if (!match) return

    const value = decodeURIComponent(match.split("=")[1] || "")
    setCurrentRole(value)
  }, [])

  const handleChange = async (event) => {
    const nextRole = event.target.value
    setCurrentRole(nextRole)
    setLoading(true)

    try {
      const res = await fetch("/api/demo-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole || null }),
      })

      if (!res.ok) {
        throw new Error("Failed to update demo role")
      }

      window.location.reload()
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-slate-700/70 bg-slate-900/90 px-4 py-3 text-xs text-slate-200 shadow-lg backdrop-blur">
      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
        Demo role
      </p>
      <div className="mt-2 flex items-center gap-2">
        <select
          value={currentRole}
          onChange={handleChange}
          disabled={loading}
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-200 outline-none focus:border-indigo-400"
        >
          <option value="">Auto</option>
          {ROLE_OPTIONS.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
        <span className="text-[11px] text-slate-400">
          {loading ? "Saving…" : currentRole ? `Role: ${currentRole}` : "Auto"}
        </span>
      </div>
    </div>
  )
}
