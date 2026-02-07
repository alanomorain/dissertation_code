export const runtime = "nodejs"

const VALID_ROLES = new Set(["ADMIN", "LECTURER", "STUDENT"])

export async function POST(req) {
  const body = await req.json().catch(() => ({}))
  const rawRole = typeof body.role === "string" ? body.role : ""
  const role = rawRole.toUpperCase()

  const headers = new Headers({ "Content-Type": "application/json" })
  const cookieOptions = "Path=/; SameSite=Lax"

  if (!role) {
    headers.append("Set-Cookie", `demo-role=; Max-Age=0; ${cookieOptions}`)
    return new Response(JSON.stringify({ ok: true, role: null }), { headers })
  }

  if (!VALID_ROLES.has(role)) {
    return new Response(
      JSON.stringify({ error: "Invalid role" }),
      { status: 400, headers },
    )
  }

  headers.append("Set-Cookie", `demo-role=${role}; Max-Age=604800; ${cookieOptions}`)
  return new Response(JSON.stringify({ ok: true, role }), { headers })
}
