// app/api/upload-slides/route.js
import OpenAI from "openai"
import { getCurrentUser } from "../../lib/currentUser"
import { enforceRateLimit } from "../../lib/rateLimit"
import { enforceCsrf } from "../../lib/security"

export const runtime = "nodejs"
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const EXTRACTOR_TIMEOUT_MS = 15000
const EXTRACTOR_ATTEMPTS = 2
const MAX_TOPIC_SOURCE_LENGTH = 15000
const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
])

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured")
  }
  return new OpenAI({ apiKey })
}

// Fallback topic picker – deterministic, based on extracted lecture text.
function fallbackTopicsFromText(text, maxTopics = 5) {
  if (text && text.trim().length > 0) {
    const parts = text
      .split(/[\.\n]/) // split on sentences / new lines
      .map((p) => p.trim())
      .filter((p) => p.length > 10)

    const unique = Array.from(new Set(parts))
    return unique.slice(0, maxTopics)
  }

  return []
}

function extractorUrl(pathname) {
  const base = String(process.env.SLIDE_EXTRACTOR_URL || "http://slide-extractor:8000").trim()
  return `${base.replace(/\/$/, "")}${pathname}`
}

function truncateDeterministically(value, maxChars) {
  return String(value || "").slice(0, maxChars)
}

function mergeTopicSourceText(extractedText, notes) {
  const cleanExtracted = String(extractedText || "").trim()
  const cleanNotes = String(notes || "").trim()

  if (cleanExtracted && cleanNotes) {
    return [
      "Lecture text extracted from uploaded slides:",
      cleanExtracted,
      "",
      "Lecturer notes (additional guidance):",
      cleanNotes,
    ].join("\n")
  }

  return cleanExtracted || cleanNotes
}

async function callExtractorOnce({ file, moduleCode }) {
  const formData = new FormData()
  formData.append("file", file, file.name || "slides")
  if (moduleCode) {
    formData.append("moduleCode", moduleCode)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), EXTRACTOR_TIMEOUT_MS)

  try {
    const response = await fetch(extractorUrl("/extract"), {
      method: "POST",
      body: formData,
      signal: controller.signal,
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const errorCode = String(payload?.error?.code || "")
      const errorMessage = String(payload?.error?.message || "Extractor request failed")
      const error = new Error(errorMessage)
      error.code = errorCode || "EXTRACTION_FAILED"
      error.status = response.status
      throw error
    }

    return payload
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Slide extraction timed out")
      timeoutError.code = "SERVICE_UNAVAILABLE"
      timeoutError.status = 504
      throw timeoutError
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function extractSlides({ file, moduleCode }) {
  let lastError = null

  for (let attempt = 1; attempt <= EXTRACTOR_ATTEMPTS; attempt += 1) {
    try {
      return await callExtractorOnce({ file, moduleCode })
    } catch (error) {
      lastError = error
      if (attempt >= EXTRACTOR_ATTEMPTS) break
    }
  }

  const code = String(lastError?.code || "")
  if (code === "UNSUPPORTED_TYPE" || code === "EMPTY_EXTRACTION") {
    throw lastError
  }

  const unavailableError = new Error("Slide extraction service is unavailable")
  unavailableError.code = "SERVICE_UNAVAILABLE"
  unavailableError.status = 503
  throw unavailableError
}

// Call OpenAI to turn raw lecture text into a clean list of topics
async function suggestTopicsFromText(text, moduleCode) {
  const systemPrompt = `
You are an educational assistant helping university lecturers prepare teaching material.
Given some lecture text, you identify up to 5 key topics or concepts that would be good
candidates for analogies.

You MUST respond with valid JSON only, no explanation, no commentary.
`.trim()

  const userPrompt = `
Module code: ${moduleCode || "UNKNOWN_MODULE"}

Lecture text:
"""${text.slice(0, 8000)}"""

Return STRICTLY in this JSON format (no extra keys, no prose):

{
  "topics": [
    "topic 1 in short natural language",
    "topic 2",
    "topic 3"
  ]
}
  You MUST return 5 or fewer topics.
`.trim()

  const client = getOpenAIClient()
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  })

  const textOut = response.output_text

  if (!textOut) {
    console.error("OpenAI returned unexpected shape:", response)
    throw new Error("No output_text received from OpenAI")
  }

  let parsed
  try {
    parsed = JSON.parse(textOut)
  } catch (err) {
    console.error("Failed to parse topics JSON from LLM:", textOut)
    throw new Error("Invalid JSON returned from OpenAI response")
  }

  if (Array.isArray(parsed.topics)) return parsed.topics.slice(0, 5)
  if (Array.isArray(parsed)) return parsed.slice(0, 5)

  throw new Error("OpenAI JSON did not contain a 'topics' array")

}

export async function POST(req) {
  try {
    const csrfResponse = enforceCsrf(req)
    if (csrfResponse) {
      return csrfResponse
    }

    const rateLimitResponse = await enforceRateLimit(req, {
      scope: "upload-slides",
      limit: 12,
      windowMs: 60 * 1000,
    })
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const lecturer = await getCurrentUser("LECTURER", { id: true })
    if (!lecturer) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file")
    const moduleCode = String(formData.get("moduleCode") || "UNKNOWN_MODULE").trim().slice(0, 50)
    const notes = String(formData.get("notes") || "").slice(0, 15000)

    if (!file || typeof file === "string") {
      return new Response(
        JSON.stringify({ error: "No file uploaded" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return Response.json(
        { error: "File is too large. Maximum allowed size is 10MB." },
        { status: 413 },
      )
    }

    if (file.type && !ALLOWED_FILE_TYPES.has(file.type)) {
      return Response.json(
        { error: "Unsupported file type. Please upload PDF or PPTX files." },
        { status: 415 },
      )
    }

    const extraction = await extractSlides({ file, moduleCode })
    const extractedText = truncateDeterministically(extraction.full_text, MAX_TOPIC_SOURCE_LENGTH)
    const topicSource = truncateDeterministically(
      mergeTopicSourceText(extractedText, notes),
      MAX_TOPIC_SOURCE_LENGTH,
    )

    if (Array.isArray(extraction.warnings) && extraction.warnings.length > 0) {
      console.warn("Slide extractor warnings:", extraction.warnings)
    }

    let topics
    try {
      topics = await suggestTopicsFromText(topicSource, moduleCode)
    } catch (err) {
      console.error("Falling back to local topic picker:", err)
      topics = fallbackTopicsFromText(topicSource)
    }

    if (!Array.isArray(topics) || topics.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Could not identify topics from extracted lecture content.",
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return new Response(
      JSON.stringify({
        topics,
        extractedText, // so the UI can show a preview
        moduleCode,
        filename: file.name,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (err) {
    if (err?.code === "UNSUPPORTED_TYPE" || err?.status === 415) {
      return new Response(
        JSON.stringify({ error: err.message || "Unsupported file type. Please upload PDF or PPTX files." }),
        { status: 415, headers: { "Content-Type": "application/json" } },
      )
    }

    if (err?.code === "EMPTY_EXTRACTION") {
      return new Response(
        JSON.stringify({ error: err.message || "No extractable text found in this file." }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      )
    }

    if (err?.code === "SERVICE_UNAVAILABLE") {
      return new Response(
        JSON.stringify({
          error: "Slide extraction service is temporarily unavailable. Please try again in a moment.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      )
    }

    console.error("Error in /api/upload-slides:", err?.response?.data || err)
    return new Response(
      JSON.stringify({
        error: "Server error while processing slides",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
