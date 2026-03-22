import OpenAI from "openai"
import { prisma } from "../../../lib/db"
import { getCurrentUser } from "../../../lib/currentUser"
import { enforceRateLimit } from "../../../lib/rateLimit"
import { enforceCsrf } from "../../../lib/security"

export const runtime = "nodejs"

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured")
  }
  return new OpenAI({ apiKey })
}

function extractTopicsFromAnalogySet(analogySet) {
  const topics = Array.isArray(analogySet?.topicsJson?.topics) ? analogySet.topicsJson.topics : []
  return topics
    .map((topic) => ({
      topic: String(topic?.topic || "").trim(),
      analogy: String(topic?.analogy || "").trim(),
    }))
    .filter((topic) => topic.topic && topic.analogy)
}

function parseJsonBlock(text) {
  const raw = String(text || "").trim()
  if (!raw) {
    throw new Error("No content returned from AI")
  }

  const fencedMatch = raw.match(/```json\s*([\s\S]*?)\s*```/i) || raw.match(/```\s*([\s\S]*?)\s*```/i)
  const jsonText = fencedMatch ? fencedMatch[1].trim() : raw
  return JSON.parse(jsonText)
}

function normalizeGeneratedQuestions(input, count) {
  const questions = Array.isArray(input?.questions) ? input.questions : Array.isArray(input) ? input : []

  return questions.slice(0, count).map((item, index) => {
    const options = Array.isArray(item?.options) ? item.options : []
    const normalizedOptions = options
      .slice(0, 6)
      .map((option, optionIndex) => {
        if (typeof option === "string") {
          return {
            text: option.trim().slice(0, 300),
            isCorrect: optionIndex === 0,
          }
        }
        return {
          text: String(option?.text || "").trim().slice(0, 300),
          isCorrect: !!option?.isCorrect,
        }
      })
      .filter((option) => option.text.length > 0)

    if (normalizedOptions.length > 0 && !normalizedOptions.some((option) => option.isCorrect)) {
      normalizedOptions[0].isCorrect = true
    }

    return {
      prompt: String(item?.prompt || "").trim().slice(0, 1000) || `Question ${index + 1}`,
      type: "MCQ",
      difficulty: ["EASY", "MEDIUM", "HARD"].includes(item?.difficulty) ? item.difficulty : "MEDIUM",
      options: normalizedOptions.length >= 2
        ? normalizedOptions
        : [
            { text: "Option A", isCorrect: true },
            { text: "Option B", isCorrect: false },
            { text: "Option C", isCorrect: false },
          ],
    }
  })
}

export async function POST(req) {
  try {
    const csrfResponse = enforceCsrf(req)
    if (csrfResponse) {
      return csrfResponse
    }

    const rateLimitResponse = enforceRateLimit(req, {
      scope: "quizzes-generate",
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

    const body = await req.json().catch(() => ({}))
    const lectureId = String(body?.lectureId || "").trim()
    const feedback = String(body?.feedback || "").trim().slice(0, 1500)
    const questionCount = Math.max(1, Math.min(Number(body?.questionCount) || 5, 12))

    if (!lectureId) {
      return Response.json({ error: "lectureId is required" }, { status: 400 })
    }

    const lectureRecord = await prisma.lecture.findFirst({
      where: { id: lectureId, ownerId: lecturer.id },
      include: {
        module: { select: { id: true, code: true, name: true } },
      },
    })

    if (!lectureRecord) {
      return Response.json({ error: "Unknown lecture for this lecturer" }, { status: 400 })
    }

    const analogySets = await prisma.analogySet.findMany({
      where: {
        ownerId: lecturer.id,
        lectureId: lectureRecord.id,
        status: "ready",
      },
      select: {
        id: true,
        title: true,
        topicsJson: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    const topics = analogySets.flatMap(extractTopicsFromAnalogySet).slice(0, 12)

    if (topics.length === 0) {
      return Response.json(
        { error: "No ready analogies found for this module. Create and save at least one first." },
        { status: 400 },
      )
    }

    const client = getOpenAIClient()
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `
You are an assessment designer for MSc Software Development modules.
Generate multiple-choice quiz questions grounded in lecturer-authored analogies.
Return valid JSON only, with no markdown and no prose.
`,
        },
        {
          role: "user",
          content: `
Module: ${lectureRecord.module.code} - ${lectureRecord.module.name}
Lecture: ${lectureRecord.title}

Analogy context:
${topics.map((item, index) => `${index + 1}. Topic: ${item.topic}\nAnalogy: ${item.analogy}`).join("\n\n")}

${feedback ? `Lecturer feedback to apply:\n${feedback}\n` : ""}

Generate exactly ${questionCount} MCQ questions.
Each question must have 4 options and exactly 1 correct option.

Return JSON with this exact shape:
{
  "questions": [
    {
      "prompt": "question text",
      "difficulty": "EASY | MEDIUM | HARD",
      "options": [
        { "text": "option text", "isCorrect": true },
        { "text": "option text", "isCorrect": false },
        { "text": "option text", "isCorrect": false },
        { "text": "option text", "isCorrect": false }
      ]
    }
  ]
}
`,
        },
      ],
    })

    const text = response.choices[0]?.message?.content || ""
    const parsed = parseJsonBlock(text)
    const questions = normalizeGeneratedQuestions(parsed, questionCount)

    if (questions.length === 0) {
      return Response.json({ error: "AI did not return valid quiz questions" }, { status: 502 })
    }

    return Response.json({
      questions,
      module: lectureRecord.module,
      lecture: {
        id: lectureRecord.id,
        title: lectureRecord.title,
      },
      context: {
        analogySetCount: analogySets.length,
        topicCount: topics.length,
      },
    })
  } catch (err) {
    console.error("Error generating quiz questions", err)
    return Response.json(
      { error: "Failed to generate quiz questions" },
      { status: 500 },
    )
  }
}
