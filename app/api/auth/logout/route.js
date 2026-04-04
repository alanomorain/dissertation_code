import { buildExpiredSessionCookie } from "../../../lib/auth"
import { enforceRateLimit } from "../../../lib/rateLimit"
import { enforceCsrf } from "../../../lib/security"

export const runtime = "nodejs"

export async function POST(req) {
  const csrfResponse = enforceCsrf(req)
  if (csrfResponse) {
    return csrfResponse
  }

  const rateLimitResponse = await enforceRateLimit(req, {
    scope: "auth-logout",
    limit: 30,
    windowMs: 60 * 1000,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const expiredCookie = buildExpiredSessionCookie()
  const cookieParts = [
    `${expiredCookie.name}=`,
    "Max-Age=0",
    `Path=${expiredCookie.path}`,
    "HttpOnly",
    "SameSite=Lax",
  ]

  if (expiredCookie.secure) {
    cookieParts.push("Secure")
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookieParts.join("; "),
    },
  })
}
