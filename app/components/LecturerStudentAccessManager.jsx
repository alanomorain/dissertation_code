"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import * as ui from "../styles/ui"

const STATUS_OPTIONS = ["ACTIVE", "INVITED", "DROPPED"]

function statusClass(status) {
  if (status === "ACTIVE") return "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700"
  if (status === "INVITED") return "inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700"
  return "inline-flex rounded-full border border-stone-200 bg-stone-100 px-2 py-1 text-xs text-stone-700"
}

export default function LecturerStudentAccessManager({ modules, initialModuleCode = "" }) {
  const moduleCode = initialModuleCode || ""
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
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link href="/lecturer/students" className={!moduleCode ? ui.buttonPrimary : ui.buttonSecondary}>
            All modules
          </Link>
          {modules.map((module) => (
            <Link
              key={module.id}
              href={`/lecturer/students?module=${encodeURIComponent(module.code)}`}
              className={moduleCode === module.code ? ui.buttonPrimary : ui.buttonSecondary}
            >
              {module.code}
            </Link>
          ))}
        </div>
      </div>

      <form onSubmit={onAddEnrollment} className={`${ui.cardFull} space-y-4`}>
        <div>
          <p className={ui.textLabel}>Existing account access</p>
          <h2 className="mt-1 text-xl font-semibold">Assign or update enrollment</h2>
          <p className="mt-2 text-sm text-stone-700">
            Use this for students with an existing account. For new students, use the invite flow.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-2 text-sm">
            <span className="text-stone-700">Student email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
              required
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-stone-700">Module</span>
            <select
              value={targetModuleCode}
              onChange={(event) => setTargetModuleCode(event.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
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
            <span className="text-stone-700">Status</span>
            <select
              value={targetStatus}
              onChange={(event) => setTargetStatus(event.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
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

      {error ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div> : null}
      {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

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
                  <p className="font-medium text-stone-950">{enrollment.user.email}</p>
                  <p className="text-xs text-stone-600">
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
                    className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs outline-none focus:border-teal-500"
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
