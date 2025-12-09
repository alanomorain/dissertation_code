// app/api/generate-analogies/route.js
import OpenAI from "openai"

export const runtime = "nodejs"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Given topics, ask OpenAI for 2–3 analogies per topic
async function generateAnalogiesForTopics(topics, moduleCode, notes) {
  const systemPrompt = `
You are an educational assistant helping university lecturers explain complex concepts 
using clear analogies. Given a teaching topic, generate 1 concise analogy suitable 
for MSc Software Development students.

You MUST respond with valid JSON only, no explanation, no commentary.
`.trim()

  const userPrompt = `
Module code: ${moduleCode || "UNKNOWN_MODULE"}

Additional lecturer notes (may be empty):
"""${(notes || "").toString().slice(0, 1000)}"""

Here are the topics the lecturer wants analogies for. 
For EACH topic, generate exactly 1 analogy.

Return STRICTLY in this JSON format (no prose, no other keys):

[
  {
    "original": "the original topic here",
    "analogies": [
      "the single analogy for this topic"
    ]
  }
]

Topics:
${topics.map((t, i) => `${i + 1}. ${t}`).join("\n")}
`.trim()

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  })

  const text = response.output_text

  if (!text) {
    console.error("OpenAI returned unexpected shape:", response)
    throw new Error("No output_text received from OpenAI")
  }

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (err) {
    console.error("Failed to parse LLM JSON:", text)
    throw new Error("Invalid JSON returned from OpenAI response")
  }

  if (Array.isArray(parsed)) return parsed
  if (Array.isArray(parsed.points)) return parsed.points

  throw new Error("OpenAI JSON did not match expected structure")
}

export async function POST(req) {
  try {
    const body = await req.json()
    const topics = body.topics || []
    const moduleCode = body.moduleCode || "UNKNOWN_MODULE"
    const notes = body.notes || ""

    if (!Array.isArray(topics) || topics.length === 0) {
      return new Response(
        JSON.stringify({ error: "No topics provided" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const analogies = await generateAnalogiesForTopics(topics, moduleCode, notes)

    return new Response(
      JSON.stringify({ analogies }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (err) {
    console.error("Error in /api/generate-analogies:", err?.response?.data || err)
    return new Response(
      JSON.stringify({
        error: "Server error while generating analogies",
        details: err.message || String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
