import { GoogleGenerativeAI } from "@google/generative-ai"

export const runtime = "nodejs"

const apiKey = process.env.GEMINI_API_KEY
const modelName = process.env.GEMINI_IMAGE_MODEL

export async function POST(req) {
  try {
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    if (!modelName) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_IMAGE_MODEL is not configured for image generation.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    const body = await req.json()
    const { analogyText, topic, style } = body

    if (!analogyText) {
      return new Response(
        JSON.stringify({ error: "analogyText is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: modelName })

    const prompt = `
Create a clean, student-friendly illustration that visually explains this analogy.
Keep it suitable for a university lecturer.
${style ? `Style: ${style}` : ""}

Topic: ${topic || "(unspecified)"}
Analogy:
"""${analogyText}"""
`.trim()

    const result = await model.generateContent([prompt])
    const response = result?.response
    const parts = response?.candidates?.[0]?.content?.parts || []

    const inlinePart = parts.find((part) => part.inlineData?.data)

    if (!inlinePart) {
      return new Response(
        JSON.stringify({
          error: "No image data returned from Gemini.",
          details: response?.candidates?.[0]?.content || null,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    const { mimeType, data } = inlinePart.inlineData
    const dataUrl = `data:${mimeType};base64,${data}`

    return new Response(
      JSON.stringify({ dataUrl }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (err) {
    console.error("Error in /api/generate-image:", err)
    return new Response(
      JSON.stringify({
        error: "Server error while generating image",
        details: err.message || String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
