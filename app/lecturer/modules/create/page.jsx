"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import * as ui from "../../../styles/ui"

export default function CreateModulePage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    if (!code.trim() || !name.trim()) {
      setMessage({
        type: "error",
        text: "Module code and name are required.",
      })
      setSaving(false)
      return
    }

    try {
      const res = await fetch("/api/modules/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim(),
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create module")
      }

      setMessage({
        type: "success",
        text: "Module created successfully! Redirecting...",
      })

      setTimeout(() => {
        router.push("/lecturer/modules")
      }, 500)
    } catch (err) {
      console.error(err)
      setMessage({
        type: "error",
        text: err.message || "Something went wrong while creating the module.",
      })
      setSaving(false)
    }
  }

  return (
    <main className={ui.page}>
      {/* Top bar */}
      <header className={ui.header}>
        <div className={ui.headerContentNarrow}>
          <div>
            <h1 className="text-lg font-semibold">
              Create Module
            </h1>
          </div>
          <Link href="/lecturer" className={ui.buttonSecondary}>
            Back to dashboard
          </Link>
        </div>
      </header>

      {/* Content */}
      <section className={ui.pageSection}>
        <div className={`${ui.containerNarrow} py-6`}>
          <div className={`${ui.card} p-6 md:p-8`}>
            <p className="text-sm text-stone-700 mb-4">
              Add a new module so you can generate and manage analogies for it.
            </p>

            {message && (
              <div
                className={`mb-4 rounded-lg px-3 py-2 text-sm ${
                  message.type === "error"
                    ? "bg-red-50 border border-red-200 text-red-700"
                    : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-stone-800">
                  Module Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g., CSC7099"
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
                <p className="text-xs text-stone-600">
                  Unique identifier (3–10 uppercase letters/numbers).
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-stone-800">
                  Module Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Advanced Cloud Computing"
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
                <p className="text-xs text-stone-600">
                  Full name of the module.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-stone-800">
                  Description (optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the module..."
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className={`${ui.buttonPrimary} px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {saving ? "Creating..." : "Create Module"}
                </button>
                <Link
                  href="/lecturer"
                  className="text-sm text-stone-700 hover:text-teal-700"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
