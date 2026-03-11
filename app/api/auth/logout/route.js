import { buildExpiredSessionCookie } from "../../../lib/auth"

export const runtime = "nodejs"

export async function POST() {
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
