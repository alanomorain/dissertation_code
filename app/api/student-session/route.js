export const runtime = "nodejs"

export async function POST(req) {
  return Response.json(
    { error: "Demo student switching has been removed. Use /api/auth/login instead." },
    { status: 410 },
  )
}
