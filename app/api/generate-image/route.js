import { GoogleGenerativeAI } from "@google/generative-ai"
import { getCurrentUser } from "../../lib/currentUser"

export const runtime = "nodejs"

const apiKey = process.env.GEMINI_API_KEY
const modelName = process.env.GEMINI_IMAGE_MODEL

export async function POST(req) {
  try {
    const lecturer = await getCurrentUser("LECTURER", { id: true })
    if (!lecturer) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

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
    const analogyText = String(body?.analogyText || "").trim().slice(0, 4000)
    const topic = String(body?.topic || "").trim().slice(0, 200)
    const style = String(body?.style || "").trim().slice(0, 200)

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
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
