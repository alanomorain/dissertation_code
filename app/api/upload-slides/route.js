import OpenAI from "openai"

export const runtime = "nodejs" // needed for Buffer & Node libs

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Very simple “key point picker” – for now based on notes or a stub
function pickKeyPoints(notes, maxPoints = 5) {
  if (notes && notes.trim().length > 0) {
    const parts = notes
      .split(/[\.\n]/) // split on sentences / new lines
      .map((p) => p.trim())
      .filter((p) => p.length > 10)

    const unique = Array.from(new Set(parts))
    return unique.slice(0, maxPoints)
  }

  // Fallback: pretend these are the main slide points
  return [
    "Introduction to microservices vs monolithic architectures",
    "Benefits and trade-offs of microservices",
    "How microservices relate to teaching via analogies",
  ].slice(0, maxPoints)
}

async function generateAnalogiesForPoints(points, moduleCode) {
  const systemPrompt = 
`You are an educational assistant helping university lecturers explain complex concepts using clear analogies.
Given a key teaching point, generate 2–3 concise analogies suitable for MSc Software Development students.
You MUST respond with valid JSON only, no explanation, no commentary.`.trim()

  const userPrompt = `
Here are the key points from a lecture. For EACH point, generate 2–3 analogies.

Return strictly in this JSON format (no prose, no explanation):

[
  {
    "original": "the original key point text here",
    "analogies": [
      "first analogy",
      "second analogy"
    ]
  }
]

Key points:
${points.map((p, i) => `${i + 1}. ${p}`).join("\n")}
  `.trim()

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  })

  // NEW — The SDK now exposes the final output as response.output_text
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

    // Read the file into a buffer (we'll use this later for real slide parsing)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log("Received slide deck:", {
      name: file.name,
      size: buffer.length,
      type: file.type,
      moduleCode,
    })

    // TODO (later): actually parse the PDF/PPTX using buffer.
    // For now we'll derive key points from notes / stub so the pipeline works.
    const keyPoints = pickKeyPoints(notes.toString())

    const analogies = await generateAnalogiesForPoints(keyPoints, moduleCode)

    return new Response(
      JSON.stringify({ points: analogies }),
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
