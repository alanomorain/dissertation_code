"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import * as ui from "../../../../styles/ui"

export default function EditAnalogyPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id

  const [analogy, setAnalogy] = useState(null)
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [title, setTitle] = useState("")
  const [concept, setConcept] = useState("")
  const [moduleCode, setModuleCode] = useState("")
  const [analogyText, setAnalogyText] = useState("")
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Fetch analogy and modules on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch analogy
        const analogyRes = await fetch(`/api/analogies/${id}`)
        if (!analogyRes.ok) {
          setNotFound(true)
          setLoading(false)
          return
        }
        const analogyData = await analogyRes.json()
        setAnalogy(analogyData)

        // Parse topicsJson to get concept and analogy text
        let concept = ""
        let analogyTextFromDb = ""
        if (
          analogyData.topicsJson &&
          analogyData.topicsJson.topics &&
          analogyData.topicsJson.topics.length > 0
        ) {
          const firstTopic = analogyData.topicsJson.topics[0]
          concept = firstTopic.topic || ""
          analogyTextFromDb = firstTopic.analogy || ""
        }

        // Pre-fill form from DB data
        setTitle(analogyData.title || "")
        setConcept(concept)
        setAnalogyText(analogyTextFromDb)

        // Find module code from moduleId
        if (analogyData.moduleId) {
          const modulesRes = await fetch("/api/modules")
          if (modulesRes.ok) {
            const modulesData = await modulesRes.json()
            setModules(modulesData)

            // Find the module code that matches this analogy's moduleId
            const matchingModule = modulesData.find(
              (m) => m.id === analogyData.moduleId
            )
            if (matchingModule) {
              setModuleCode(matchingModule.code)
            }
          }
        } else {
          // Fetch modules if no module assigned
          const modulesRes = await fetch("/api/modules")
          if (modulesRes.ok) {
            const modulesData = await modulesRes.json()
            setModules(modulesData)
            if (modulesData.length > 0) {
              setModuleCode(modulesData[0].code)
            }
          }
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching data:", err)
        setNotFound(true)
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    if (!title || !concept || !analogyText || !moduleCode) {
      setMessage({
        type: "error",
        text: "Please fill in all required fields.",
      })
      setSaving(false)
      return
    }

    try {
      const res = await fetch("/api/generate-analogies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title,
          concept,
          analogyText,
          moduleCode,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update analogy")
      }

      const data = await res.json()

      setMessage({
        type: "success",
        text: "Analogy updated successfully! Redirecting...",
      })

      // Redirect to the detail page
      setTimeout(() => {
        router.push(`/lecturer/analogies/${data.id}`)
      }, 500)
    } catch (err) {
      console.error(err)
      setMessage({
        type: "error",
        text: err.message || "Failed to update analogy",
      })
      setSaving(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setImageFile(file || null)
  }

  if (loading) {
    return (
      <main className={ui.page}>
        <header className={ui.header}>
          <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Loading...</h1>
            <Link href="/lecturer/analogies" className={ui.buttonSecondary}>
              Back to analogies
            </Link>
          </div>
        </header>
        <section className="flex-1 flex items-center justify-center">
          <div className="text-slate-300">Loading analogy...</div>
        </section>
      </main>
    )
  }

  if (notFound) {
    return (
      <main className={ui.page}>
        <header className={ui.header}>
          <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Analogy not found</h1>
            <Link
              href="/lecturer/analogies"
              className={ui.buttonSecondary}
            >
              Back to analogies
            </Link>
          </div>
        </header>
        <section className="flex-1 flex items-center">
          <div className="mx-auto max-w-4xl px-4 py-6 text-sm text-slate-300">
            No analogy exists with ID {id}.
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={ui.page}>
      {/* Top bar */}
      <header className={ui.header}>
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div>
            <p className={ui.textLabel}>Lecturer · Edit Analogy</p>
            <h1 className="text-lg font-semibold">Edit analogy #{id}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/lecturer/analogies"
              className={ui.buttonSecondary}
            >
              Back to analogies
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className={ui.pageSection}>
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className={`${ui.card} p-6 md:p-8`}>
            <p className="text-sm text-slate-300 mb-4">
              You're editing an existing analogy.
            </p>

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
                  onChange={(e) => setModuleCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                >
                  {modules.map((module) => (
                    <option key={module.id} value={module.code}>
                      {module.code} · {module.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
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
              </div>

              {/* Concept */}
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
              </div>

              {/* Replace / update image */}
              <div className="space-y-1">
                <label
                  htmlFor="image"
                  className="block text-sm font-medium text-slate-200"
                >
                  Replace supporting image (optional)
                </label>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-indigo-400"
                />
                <p className="text-xs text-slate-400">
                  Optional: upload a new image to replace the current one.
                </p>
                {imageFile && (
                  <p className="text-xs text-slate-300 mt-1">
                    New selected file:{" "}
                    <span className="font-medium">{imageFile.name}</span>
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
                  {saving ? "Saving changes..." : "Save changes"}
                </button>
                <Link
                  href="/lecturer/analogies"
                  className="text-sm text-slate-300 hover:text-indigo-200"
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
