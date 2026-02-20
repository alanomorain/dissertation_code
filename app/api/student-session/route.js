export const runtime = "nodejs"

export async function POST(req) {
  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

  const headers = new Headers({ "Content-Type": "application/json" })
  const cookieOptions = "Path=/; SameSite=Lax"

  if (!email) {
    headers.append("Set-Cookie", `demo-student-email=; Max-Age=0; ${cookieOptions}`)
    return new Response(JSON.stringify({ ok: true, email: null }), { headers })
  }

  headers.append(
    "Set-Cookie",
    `demo-student-email=${encodeURIComponent(email)}; Max-Age=604800; ${cookieOptions}`,
  )

  return new Response(JSON.stringify({ ok: true, email }), { headers })
}
