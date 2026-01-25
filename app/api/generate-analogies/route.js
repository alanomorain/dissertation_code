// app/api/generate-analogies/route.js
import OpenAI from "openai"
import { prisma } from "../../lib/db.js"

export const runtime = "nodejs"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Given a single topic, ask OpenAI for 1 analogy
async function generateAnalogyForTopic(topic, notes) {
  // Remove moduleCode parameter
  const systemPrompt = `
You are an educational assistant helping university lecturers explain complex concepts 
using clear analogies. Given a teaching topic, generate 1 concise analogy suitable 
for MSc Software Development students.

You MUST respond with valid JSON only, no explanation, no commentary.
`.trim()

  const userPrompt = `
Additional lecturer notes (may be empty):
"""${(notes || "").toString().slice(0, 1000)}"""

Generate exactly 1 analogy for this topic suitable for students:

Topic: ${topic}

Return STRICTLY in this JSON format (no prose, no other keys):

{
  "topic": "the topic here",
  "analogy": "the single analogy for this topic"
}
`.trim()

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  })

  const text = response.choices[0]?.message?.content || ""

  if (!text) {
    console.error("OpenAI returned unexpected shape:", response)
    throw new Error("No content received from OpenAI")
  }

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (err) {
    console.error("Failed to parse LLM JSON:", text)
    throw new Error("Invalid JSON returned from OpenAI response")
  }

  return parsed
}

export async function POST(req) {
  let analogySetId = null

  try {
    const body = await req.json()
    const { title, concept, moduleCode, notes } = body

    // Validate required fields
    if (!concept || !notes) {
      return new Response(
        JSON.stringify({ error: "concept and notes are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Create initial AnalogySet row with processing status
    const analogySet = await prisma.analogySet.create({
      data: {
        status: "processing",
        ownerRole: "lecturer",
        title: title || concept,
        source: "manual",
        sourceText: notes,
      },
    })

    analogySetId = analogySet.id

    // Generate analogy using OpenAI
    let generated
    try {
      generated = await generateAnalogyForTopic(concept, notes)
    } catch (err) {
      // Update row with error status
      await prisma.analogySet.update({
        where: { id: analogySetId },
        data: {
          status: "failed",
          errorMessage: err.message || "Failed to generate analogy",
        },
      })

      return new Response(
        JSON.stringify({
          error: "Failed to generate analogy",
          details: err.message,
          id: analogySetId,
          status: "failed",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Update row with generated analogy
    const updated = await prisma.analogySet.update({
      where: { id: analogySetId },
      data: {
        status: "ready",
        topicsJson: {
          topics: [
            {
              topic: generated.topic || concept,
              analogy: generated.analogy || "",
            },
          ],
        },
      },
    })

    return new Response(
      JSON.stringify({ id: updated.id, status: updated.status }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (err) {
    console.error("Error in /api/generate-analogies:", err)

    // If we created a row but hit an unexpected error, mark it failed
    if (analogySetId) {
      await prisma.analogySet.update({
        where: { id: analogySetId },
        data: {
          status: "failed",
          errorMessage: err.message || "Unexpected server error",
        },
      }).catch((e) => console.error("Failed to update error status:", e))
    }

    return new Response(
      JSON.stringify({
        error: "Server error while generating analogy",
        details: err.message || String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
