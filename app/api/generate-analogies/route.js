// app/api/generate-analogies/route.js
import OpenAI from "openai"
import { prisma } from "../../lib/db"

export const runtime = "nodejs"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Given a single topic, ask OpenAI for 1 analogy
async function generateAnalogyForTopic(topic, notes) {
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

// Generate multiple analogies for batch topics
async function generateAnalogiesForTopics(topics, notes) {
  const systemPrompt = `
You are an educational assistant helping university lecturers explain complex concepts 
using clear analogies. Given teaching topics, generate 2-3 concise analogies for each topic 
suitable for MSc Software Development students.

You MUST respond with valid JSON only, no explanation, no commentary.
`.trim()

  const userPrompt = `
Additional lecturer notes (may be empty):
"""${(notes || "").toString().slice(0, 1000)}"""

Generate 2-3 analogies for each of these topics:

${topics.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Return STRICTLY in this JSON format (no prose, no other keys):

[
  {
    "original": "first topic",
    "analogies": ["analogy 1", "analogy 2", "analogy 3"]
  },
  {
    "original": "second topic",
    "analogies": ["analogy 1", "analogy 2"]
  }
]
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

function normalizeTopics(topics) {
  if (!Array.isArray(topics)) return []
  return topics
    .filter((item) => item && (item.topic || item.analogy))
    .map((item) => ({
      topic: item.topic || "",
      analogy: item.analogy || "",
      feedback: item.feedback || "",
    }))
}

export async function POST(req) {
  let analogySetId = null

  try {
    const body = await req.json()
    const { title, concept, topics, notes, persist, sourceText, selectedAnalogies } = body

    // Two modes: single concept or batch topics
    const isSingleMode = !!concept
    const isBatchMode = Array.isArray(topics) && topics.length > 0

    if (!isSingleMode && !isBatchMode) {
      return new Response(
        JSON.stringify({ error: "Either 'concept' or 'topics' array is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    if (isSingleMode && !notes) {
      return new Response(
        JSON.stringify({ error: "concept and notes are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // If persist is true, create DB row first
    if (persist) {
      const analogySet = await prisma.analogySet.create({
        data: {
          status: "processing",
          reviewStatus: "DRAFT",
          approvedAt: null,
          title: title || (isSingleMode ? concept : `Batch: ${topics.join(", ")}`),
          source: isBatchMode ? "slides" : "manual",
          sourceText: sourceText || notes || "",
        },
      })
      analogySetId = analogySet.id
    }

    try {
      let generated

      if (isSingleMode) {
        // Single concept mode
        generated = await generateAnalogyForTopic(concept, notes)
        
        if (persist) {
          // Update row with single analogy
          const updated = await prisma.analogySet.update({
            where: { id: analogySetId },
            data: {
              status: "ready",
              reviewStatus: "DRAFT",
              approvedAt: null,
              topicsJson: {
                topics: [
                  {
                    topic: generated.topic || concept,
                    analogy: generated.analogy || "",
                    feedback: "",
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
        } else {
          // Return analogy directly without persisting
          return new Response(
            JSON.stringify({ analogy: generated }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          )
        }
      } else {
        // Batch topics mode
        generated = await generateAnalogiesForTopics(topics, notes || sourceText || "")
        
        if (persist) {
          // Convert [ { original, analogies: [...] } ] to { topics: [{ topic, analogy }] }
          const topicsArray = Array.isArray(selectedAnalogies) && selectedAnalogies.length > 0
            ? selectedAnalogies
                .filter((item) => item?.topic && item?.analogy)
                .map((item) => ({
                  topic: item.topic,
                  analogy: item.analogy,
                  feedback: item.feedback || "",
                }))
            : generated
                .filter((item) => item.analogies && item.analogies.length > 0)
                .map((item) => ({
                  topic: item.original || "",
                  analogy: item.analogies[0] || "",
                  feedback: "",
                }))

          const updated = await prisma.analogySet.update({
            where: { id: analogySetId },
            data: {
              status: "ready",
              reviewStatus: "DRAFT",
              approvedAt: null,
              topicsJson: { topics: topicsArray },
            },
          })

          return new Response(
            JSON.stringify({ id: updated.id, status: updated.status }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          )
        } else {
          // Return analogies directly without persisting
          return new Response(
            JSON.stringify({ analogies: generated }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          )
        }
      }
    } catch (err) {
      // Update row with error status if persisting
      if (persist && analogySetId) {
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

      throw err
    }
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

export async function PATCH(req) {
  try {
    const body = await req.json()
    const { id, title, concept, analogyText, moduleCode, action, topics, notes } = body

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Analogy ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    if (action) {
      if (action === "approve") {
        const updated = await prisma.analogySet.update({
          where: { id },
          data: {
            reviewStatus: "APPROVED",
            approvedAt: new Date(),
          },
        })

        return new Response(
          JSON.stringify({
            id: updated.id,
            reviewStatus: updated.reviewStatus,
            approvedAt: updated.approvedAt,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      if (action === "requestChanges") {
        const nextTopics = normalizeTopics(topics)

        const updated = await prisma.analogySet.update({
          where: { id },
          data: {
            reviewStatus: "CHANGES",
            approvedAt: null,
            topicsJson: nextTopics.length ? { topics: nextTopics } : undefined,
          },
        })

        return new Response(
          JSON.stringify({
            id: updated.id,
            reviewStatus: updated.reviewStatus,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      if (action === "updateFeedback") {
        const nextTopics = normalizeTopics(topics)

        if (nextTopics.length === 0) {
          return new Response(
            JSON.stringify({ error: "Topics with feedback are required" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          )
        }

        const updated = await prisma.analogySet.update({
          where: { id },
          data: {
            topicsJson: { topics: nextTopics },
          },
        })

        return new Response(
          JSON.stringify({
            id: updated.id,
            reviewStatus: updated.reviewStatus,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      if (action === "regenerate") {
        const existing = await prisma.analogySet.findUnique({
          where: { id },
        })

        if (!existing) {
          return new Response(
            JSON.stringify({ error: "Analogy not found" }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            },
          )
        }

        const existingTopics = normalizeTopics(existing.topicsJson?.topics || [])
        const topicNames = existingTopics.map((item) => item.topic).filter(Boolean)

        if (topicNames.length === 0) {
          return new Response(
            JSON.stringify({ error: "No topics available to regenerate" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          )
        }

        const regenerated = await generateAnalogiesForTopics(
          topicNames,
          notes || existing.sourceText || "",
        )

        const regeneratedTopics = topicNames.map((topic, index) => {
          const match = Array.isArray(regenerated) ? regenerated[index] : null
          const analogy = match?.analogies?.[0] || ""
          return {
            topic,
            analogy,
            feedback: "",
          }
        })

        const updated = await prisma.analogySet.update({
          where: { id },
          data: {
            status: "ready",
            reviewStatus: "DRAFT",
            approvedAt: null,
            topicsJson: { topics: regeneratedTopics },
          },
        })

        return new Response(
          JSON.stringify({
            id: updated.id,
            reviewStatus: updated.reviewStatus,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      return new Response(
        JSON.stringify({ error: "Unknown action" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    if (!title || !concept || !analogyText) {
      return new Response(
        JSON.stringify({
          error: "Title, concept, and analogy text are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Find the module by code if provided
    let moduleId = null
    if (moduleCode) {
      const moduleRecord = await prisma.module.findUnique({
        where: { code: moduleCode },
      })
      if (moduleRecord) {
        moduleId = moduleRecord.id
      }
    }

    // Update the analogy
    const updated = await prisma.analogySet.update({
      where: { id },
      data: {
        title,
        sourceText: analogyText,
        topicsJson: {
          topics: [
            {
              topic: concept,
              analogy: analogyText,
              feedback: "",
            },
          ],
        },
        moduleId,
        reviewStatus: "DRAFT",
        approvedAt: null,
      },
    })

    return new Response(
      JSON.stringify({
        id: updated.id,
        title: updated.title,
        status: updated.status,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (err) {
    console.error("Error in PATCH /api/generate-analogies:", err)

    return new Response(
      JSON.stringify({
        error: "Server error while updating analogy",
        details: err.message || String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
