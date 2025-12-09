// app/api/upload-slides/route.js
import OpenAI from "openai"

export const runtime = "nodejs" // needed for Buffer & Node libs

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Fallback topic picker – deterministic, based on text we have (notes for now)
function fallbackTopicsFromText(text, maxTopics = 5) {
  if (text && text.trim().length > 0) {
    const parts = text
      .split(/[\.\n]/) // split on sentences / new lines
      .map((p) => p.trim())
      .filter((p) => p.length > 10)

    const unique = Array.from(new Set(parts))
    return unique.slice(0, maxTopics)
  }

  // Very rough stub if we somehow have no text at all
  return [
    "Introduction to microservices vs monolithic architectures",
    "Benefits and trade-offs of microservices",
    "Microservices and teaching via analogies",
  ].slice(0, maxTopics)
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
    const formData = await req.formData()
    const file = formData.get("file")
    const moduleCode = formData.get("moduleCode") || "UNKNOWN_MODULE"
    const notes = formData.get("notes") || ""

    if (!file || typeof file === "string") {
      return new Response(
        JSON.stringify({ error: "No file uploaded" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Read the file into a buffer (so we're ready to do real slide parsing later)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log("Received slide deck:", {
      name: file.name,
      size: buffer.length,
      type: file.type,
      moduleCode,
    })

    // TODO (later): actually parse the PDF/PPTX using `buffer`.
    // For now, we treat `notes` as our "extractedText".
    const extractedText = notes.toString()

    let topics
    try {
      // Try to get smart topics from OpenAI
      topics = await suggestTopicsFromText(extractedText || file.name, moduleCode)
    } catch (err) {
      console.error("Falling back to local topic picker:", err)
      topics = fallbackTopicsFromText(extractedText || file.name)
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
    console.error("Error in /api/upload-slides:", err?.response?.data || err)
    return new Response(
      JSON.stringify({
        error: "Server error while processing slides",
        details: err.message || String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}