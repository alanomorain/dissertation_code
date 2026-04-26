import { GoogleGenerativeAI } from "@google/generative-ai"
import { getCurrentUser } from "../../lib/currentUser"
import { enforceRateLimit } from "../../lib/rateLimit"
import { enforceCsrf } from "../../lib/security"
import { attachMediaToTopic, uploadImage } from "../../lib/mediaProvider"

export const runtime = "nodejs"
const AI_MEDIA_ENABLED = String(process.env.ENABLE_AI_MEDIA_GENERATION || "").toLowerCase() === "true"

const apiKey = process.env.GEMINI_API_KEY
const modelName = process.env.GEMINI_IMAGE_MODEL

export async function POST(req) {
  try {
    if (!AI_MEDIA_ENABLED) {
      return Response.json(
        { error: "AI media generation is not enabled. Upload media manually instead." },
        { status: 501 },
      )
    }

    const csrfResponse = enforceCsrf(req)
    if (csrfResponse) {
      return csrfResponse
    }

    const rateLimitResponse = await enforceRateLimit(req, {
      scope: "generate-image",
      limit: 20,
      windowMs: 60 * 1000,
    })
    if (rateLimitResponse) {
      return rateLimitResponse
    }

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
    const analogySetId = String(body?.analogySetId || "").trim()
    const parsedTopicIndex = Number(body?.topicIndex)
    const topicIndex = Number.isInteger(parsedTopicIndex) ? parsedTopicIndex : null

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
    const bytes = Buffer.from(data, "base64")
    const generatedFile = {
      name: `generated-analogy-${Date.now()}.png`,
      type: mimeType || "image/png",
      size: bytes.length,
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    }
    const upload = await uploadImage(generatedFile, {
      lecturerId: lecturer.id,
      source: "ai-generated-analogy",
    })

    let attachedTopic = null
    if (analogySetId && topicIndex !== null) {
      const result = await attachMediaToTopic({
        lecturerId: lecturer.id,
        analogySetId,
        topicIndex,
        imageUrl: upload.url,
      })
      attachedTopic = result.topic || null
    }

    return new Response(
      JSON.stringify({ dataUrl, url: upload.url, media: upload, topic: attachedTopic }),
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
