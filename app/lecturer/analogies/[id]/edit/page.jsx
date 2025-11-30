"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

// Mock data for now – later you'll fetch from DB/API
const MOCK_ANALOGIES = [
  {
    id: 1,
    moduleCode: "CSC7058",
    moduleName: "Individual Software Development Project",
    title: "Microservices as a fleet of food trucks",
    concept: "Microservices architecture",
    analogyText:
      "Imagine each microservice is like an individual food truck, each specialising in one type of food...",
    hasImage: true,
  },
  {
    id: 2,
    moduleCode: "CSC7084",
    moduleName: "Web Development",
    title: "HTTP requests as sending letters",
    concept: "HTTP & REST",
    analogyText:
      "Think of an HTTP request as sending a letter to a specific address (URL)...",
    hasImage: false,
  },
]

export default function EditAnalogyPage() {
  const params = useParams()
    const id = params.id
  const numericId = Number(id)

  const existing = MOCK_ANALOGIES.find((a) => a.id === numericId)

  // If nothing matches, show a simple “not found” message
  if (!existing) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
        <header className="border-b border-slate-800">
          <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Analogy not found</h1>
            <Link
              href="/lecturer/analogies"
              className="text-sm rounded-lg border border-slate-600 px-3 py-1.5 hover:border-indigo-400 hover:text-indigo-200 transition"
            >
              Back to analogies
            </Link>
          </div>
        </header>
        <section className="flex-1 flex items-center">
          <div className="mx-auto max-w-4xl px-4 py-6 text-sm text-slate-300">
            No analogy exists with ID {id}. In the real system, this would be
            handled by the router / database.
          </div>
        </section>
      </main>
    )
  }

  // Pre-fill state from the existing analogy
  const [title, setTitle] = useState(existing.title)
  const [concept, setConcept] = useState(existing.concept)
  const [moduleCode, setModuleCode] = useState(existing.moduleCode)
  const [analogyText, setAnalogyText] = useState(existing.analogyText ?? "")
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    if (!title || !concept || !analogyText) {
      setMessage({
        type: "error",
        text: "Please fill in the title, concept and analogy text.",
      })
      setSaving(false)
      return
    }

    // For now, just log – later this will PATCH to your API/DB
    console.log("Updated analogy data:", {
      id: numericId,
      title,
      concept,
      moduleCode,
      analogyText,
      imageFile,
    })

    setTimeout(() => {
      setSaving(false)
      setMessage({
        type: "success",
        text:
          "Analogy updated (mock). In the final system this would save to the database.",
      })
    }, 800)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setImageFile(file || null)
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Lecturer · Edit Analogy
            </p>
            <h1 className="text-lg font-semibold">
              Edit analogy #{id}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/lecturer/analogies"
              className="rounded-lg border border-slate-600 px-3 py-1.5 hover:border-indigo-400 hover:text-indigo-200 transition"
            >
              Back to analogies
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 md:p-8">
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
                  <option value="CSC7058">
                    CSC7058 · Individual Software Development Project
                  </option>
                  <option value="CSC7084">
                    CSC7084 · Web Development
                  </option>
                  <option value="CSC7072">
                    CSC7072 · Databases
                  </option>
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
                  {" "}
                  {existing.hasImage ? "An image is attached" : "No image yet"}.
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
                  className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
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
