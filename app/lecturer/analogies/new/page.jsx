"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import * as ui from "../../../styles/ui"

export default function NewAnalogyPage() {
  const router = useRouter()
  const [modules, setModules] = useState([])
  const [title, setTitle] = useState("")
  const [concept, setConcept] = useState("")
  const [moduleCode, setModuleCode] = useState("")
  const [analogyText, setAnalogyText] = useState("")
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Module creation modal state
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [newModuleCode, setNewModuleCode] = useState("")
  const [newModuleName, setNewModuleName] = useState("")
  const [newModuleDescription, setNewModuleDescription] = useState("")
  const [creatingModule, setCreatingModule] = useState(false)
  const [moduleError, setModuleError] = useState("")

  // Fetch modules on mount
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch("/api/modules")
        if (res.ok) {
          const data = await res.json()
          setModules(data)
          if (data.length > 0) {
            setModuleCode(data[0].code)
          }
        }
      } catch (err) {
        console.error("Failed to fetch modules:", err)
      }
    }
    fetchModules()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    // Basic client-side validation
    if (!title || !concept || !analogyText || !moduleCode) {
      setMessage({
        type: "error",
        text: "Please fill in all required fields.",
      })
      setSaving(false)
      return
    }

    try {
      // Call the API to create analogy
      const res = await fetch("/api/generate-analogies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          concept,
          moduleCode,
          notes: analogyText,
          persist: true,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create analogy")
      }

      const data = await res.json()

      setMessage({
        type: "success",
        text: "Analogy created successfully! Redirecting...",
      })

      // Redirect to the detail page
      setTimeout(() => {
        router.push(`/lecturer/analogies/${data.id}`)
      }, 500)
    } catch (err) {
      console.error(err)
      setMessage({
        type: "error",
        text: err.message || "Failed to create analogy",
      })
      setSaving(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setImageFile(file || null)
  }

  const handleCreateModule = async () => {
    if (!newModuleCode.trim() || !newModuleName.trim()) {
      setModuleError("Module code and name are required")
      return
    }

    setCreatingModule(true)
    setModuleError("")

    try {
      const res = await fetch("/api/modules/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newModuleCode.trim(),
          name: newModuleName.trim(),
          description: newModuleDescription.trim(),
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create module")
      }

      const data = await res.json()

      // Add the new module to the modules list
      setModules((prev) => [...prev, data])

      // Select the newly created module
      setModuleCode(data.code)
      setShowModuleModal(false)
      setNewModuleCode("")
      setNewModuleName("")
      setNewModuleDescription("")

      setMessage({
        type: "success",
        text: `Module "${data.name}" created successfully!`,
      })
    } catch (err) {
      console.error(err)
      setModuleError(err.message || "Something went wrong")
    } finally {
      setCreatingModule(false)
    }
  }

  return (
    <main className={ui.page}>
      {/* top bar */}
      <header className={ui.header}>
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              New Analogy
            </h1>
          </div>
          <Link
            href="/lecturer"
            className={ui.buttonSecondary}
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      {/* Content */}
      <section className={ui.pageSection}>
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className={`${ui.card} p-6 md:p-8`}>
            <p className="text-sm text-slate-300 mb-4">
              Here you can manually add a new analogy to your modules
            </p>

            {/* onSubmit message box */}
            {message && (
              <div
                className={`mb-4 rounded-lg px-3 py-2 text-sm ${
                  message.type === "error"
                    ? "bg-red-900/40 border border-red-600 text-red-100"
                    : "bg-emerald-900/40 border border-emerald-500 text-emerald-100"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {/* Module */}
              <div className="space-y-1">
                <label
                  htmlFor="module"
                  className="block text-sm font-medium text-slate-200"
                >
                  Module
                </label>
                <select
                  id="module"
                  value={moduleCode}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === "new") {
                      setShowModuleModal(true)
                    } else {
                      setModuleCode(val)
                    }
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                >
                  {modules.map((module) => (
                    <option key={module.id} value={module.code}>
                      {module.code} · {module.name}
                    </option>
                  ))}
                  <option value="new" className="text-indigo-300">
                    ➕ Create new module...
                  </option>
                </select>
                <p className="text-xs text-slate-400">
                  Choose the module this analogy belongs to.
                </p>
              </div>

              {/* Concept title */}
              <div className="space-y-1">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-slate-200"
                >
                  Analogy title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
                <p className="text-xs text-slate-400">
                  A short, descriptive title for the analogy.
                </p>
              </div>

              {/* Concept being explained */}
              <div className="space-y-1">
                <label
                  htmlFor="concept"
                  className="block text-sm font-medium text-slate-200"
                >
                  Concept being explained
                </label>
                <input
                  id="concept"
                  type="text"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
                <p className="text-xs text-slate-400">
                  The actual concept students should understand.
                </p>
              </div>

              {/* Analogy text */}
              <div className="space-y-1">
                <label
                  htmlFor="analogyText"
                  className="block text-sm font-medium text-slate-200"
                >
                  Analogy text
                </label>
                <textarea
                  id="analogyText"
                  value={analogyText}
                  onChange={(e) => setAnalogyText(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
                <p className="text-xs text-slate-400">
                  This is what students will see.
                </p>
              </div>

              {/* Image upload */}
              <div className="space-y-1">
                <label
                  htmlFor="image"
                  className="block text-sm font-medium text-slate-200"
                >
                  Supporting image 
                </label>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-indigo-400"
                />
                <p className="text-xs text-slate-400">
                  Upload a diagram, sketch, or visual that reinforces the
                  analogy.
                </p>
                {imageFile && (
                  <p className="text-xs text-slate-300 mt-1">
                    Selected file: <span className="font-medium">{imageFile.name}</span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className={`${ui.buttonPrimary} px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {saving ? "Creating..." : "Create Analogy"}
                </button>
                <Link
                  href="/lecturer"
                  className="text-sm text-slate-300 hover:text-indigo-200"
                >
                  Cancel and return to dashboard
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Module creation modal */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`${ui.card} p-6 w-full max-w-md rounded-lg border border-slate-700`}>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              Create New Module
            </h2>

            <div className="space-y-3">
              {/* Module code input */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Module Code
                </label>
                <input
                  type="text"
                  value={newModuleCode}
                  onChange={(e) => setNewModuleCode(e.target.value.toUpperCase())}
                  placeholder="e.g., CSC7099"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Unique identifier (e.g., CSC7099, 3-10 characters)
                </p>
              </div>

              {/* Module name input */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Module Name
                </label>
                <input
                  type="text"
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  placeholder="e.g., Advanced Cloud Computing"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Full name of the module
                </p>
              </div>

              {/* Optional description */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newModuleDescription}
                  onChange={(e) => setNewModuleDescription(e.target.value)}
                  placeholder="Brief description of the module..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              {/* Error message in modal */}
              {moduleError && (
                <div className="rounded-lg bg-red-900/40 border border-red-600 px-3 py-2 text-xs text-red-100">
                  {moduleError}
                </div>
              )}

              {/* Modal actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModuleModal(false)
                    setNewModuleCode("")
                    setNewModuleName("")
                    setNewModuleDescription("")
                    setModuleError("")
                  }}
                  className="flex-1 rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateModule}
                  disabled={creatingModule}
                  className={`flex-1 ${ui.buttonPrimary} py-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors`}
                >
                  {creatingModule ? "Creating..." : "Create Module"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}