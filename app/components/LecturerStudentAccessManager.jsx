"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import * as ui from "../styles/ui"

const STATUS_OPTIONS = ["ACTIVE", "INVITED", "DROPPED"]

function statusClass(status) {
  if (status === "ACTIVE") return "inline-flex rounded-full bg-emerald-900/40 px-2 py-1 text-xs text-emerald-200"
  if (status === "INVITED") return "inline-flex rounded-full bg-amber-900/40 px-2 py-1 text-xs text-amber-200"
  return "inline-flex rounded-full bg-slate-800/70 px-2 py-1 text-xs text-slate-300"
}

export default function LecturerStudentAccessManager({ modules, initialModuleCode = "" }) {
  const [moduleCode, setModuleCode] = useState(initialModuleCode || "")
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [email, setEmail] = useState("")
  const [targetModuleCode, setTargetModuleCode] = useState(
    initialModuleCode && modules.some((module) => module.code === initialModuleCode)
      ? initialModuleCode
      : (modules[0]?.code || ""),
  )
  const [targetStatus, setTargetStatus] = useState("ACTIVE")
  const [adding, setAdding] = useState(false)
  const [updatingId, setUpdatingId] = useState("")

  const moduleMap = useMemo(
    () => Object.fromEntries(modules.map((module) => [module.code, module])),
    [modules],
  )

  const loadEnrollments = async (selectedModuleCode) => {
    setLoading(true)
    setError("")
    setMessage("")
    try {
      const query = selectedModuleCode ? `?module=${encodeURIComponent(selectedModuleCode)}` : ""
      const res = await fetch(`/api/lecturer/students${query}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Unable to load students")
      setEnrollments(Array.isArray(data.enrollments) ? data.enrollments : [])
    } catch (err) {
      setError(err.message || "Unable to load students")
      setEnrollments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEnrollments(moduleCode)
  }, [moduleCode])

  const onAddEnrollment = async (event) => {
    event.preventDefault()
    setAdding(true)
    setError("")
    setMessage("")

    try {
      const res = await fetch("/api/lecturer/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          moduleCode: targetModuleCode,
          status: targetStatus,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Unable to update enrollment")

      setMessage(`Enrollment updated for ${data.enrollment.user.email}`)
      setEmail("")
      await loadEnrollments(moduleCode)
    } catch (err) {
      setError(err.message || "Unable to update enrollment")
    } finally {
      setAdding(false)
    }
  }

  const onUpdateStatus = async (enrollmentId, status) => {
    setUpdatingId(enrollmentId)
    setError("")
    setMessage("")
    try {
      const res = await fetch("/api/lecturer/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, status }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Unable to update access")

      setEnrollments((prev) =>
        prev.map((item) => (item.id === enrollmentId ? { ...item, status: data.enrollment.status } : item)),
      )
      setMessage("Access updated.")
    } catch (err) {
      setError(err.message || "Unable to update access")
    } finally {
      setUpdatingId("")
    }
  }

  if (modules.length === 0) {
    return (
      <div className={ui.cardFull}>
        <p className={ui.textSmall}>Create a module first before managing student access.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className={ui.cardFull}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="space-y-1">
            <p className={ui.textLabel}>Filter by module</p>
            <select
              value={moduleCode}
              onChange={(event) => setModuleCode(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              <option value="">All modules</option>
              {modules.map((module) => (
                <option key={module.id} value={module.code}>
                  {module.code} · {module.name}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href={moduleCode ? `/lecturer/students/invite?module=${encodeURIComponent(moduleCode)}` : "/lecturer/students/invite"}
              className={ui.buttonSecondary}
            >
              Invite new student
            </Link>
          </div>
        </div>
      </div>

      <form onSubmit={onAddEnrollment} className={`${ui.cardFull} space-y-4`}>
        <div>
          <p className={ui.textLabel}>Existing account access</p>
          <h2 className="mt-1 text-xl font-semibold">Assign or update enrollment</h2>
          <p className="mt-2 text-sm text-slate-300">
            Use this for students with an existing account. For new students, use the invite flow.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-2 text-sm">
            <span className="text-slate-300">Student email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              required
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-slate-300">Module</span>
            <select
              value={targetModuleCode}
              onChange={(event) => setTargetModuleCode(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              required
            >
              {modules.map((module) => (
                <option key={module.id} value={module.code}>
                  {module.code}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-slate-300">Status</span>
            <select
              value={targetStatus}
              onChange={(event) => setTargetStatus(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button type="submit" disabled={adding} className={ui.buttonPrimary}>
          {adding ? "Saving..." : "Save enrollment"}
        </button>
      </form>

      {error ? <div className="rounded-xl border border-amber-600/50 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">{error}</div> : null}
      {message ? <div className="rounded-xl border border-emerald-600/50 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-200">{message}</div> : null}

      <div className={ui.cardFull}>
        <h2 className={ui.cardHeader}>Student access</h2>
        {loading ? (
          <p className={ui.textSmall}>Loading students...</p>
        ) : enrollments.length === 0 ? (
          <p className={ui.textSmall}>No students found for the selected module scope.</p>
        ) : (
          <div className="space-y-3">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className={`${ui.cardList} flex flex-col gap-3 md:flex-row md:items-center md:justify-between`}>
                <div>
                  <p className="font-medium text-slate-100">{enrollment.user.email}</p>
                  <p className="text-xs text-slate-400">
                    {enrollment.user.studentNumber || "No student number"} · {enrollment.module.code} ·{" "}
                    {moduleMap[enrollment.module.code]?.name || enrollment.module.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={statusClass(enrollment.status)}>{enrollment.status.toLowerCase()}</span>
                  <select
                    value={enrollment.status}
                    disabled={updatingId === enrollment.id}
                    onChange={(event) => onUpdateStatus(enrollment.id, event.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs outline-none focus:border-indigo-400"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
