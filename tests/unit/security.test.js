import { describe, expect, it } from "vitest"
import { enforceCsrf } from "../../app/lib/security.js"

function request({ method = "POST", origin, referer, secFetchSite } = {}) {
  const headers = new Headers()
  if (origin) headers.set("origin", origin)
  if (referer) headers.set("referer", referer)
  if (secFetchSite) headers.set("sec-fetch-site", secFetchSite)
  return new Request("http://localhost:3000/api/example", { method, headers })
}

describe("CSRF protection", () => {
  it("allows safe methods without origin checks", () => {
    expect(enforceCsrf(request({ method: "GET", secFetchSite: "cross-site" }))).toBeNull()
  })

  it("allows same-origin mutations", () => {
    expect(enforceCsrf(request({ origin: "http://localhost:3000", secFetchSite: "same-origin" }))).toBeNull()
  })

  it("allows same-origin referer when origin is not sent", () => {
    expect(enforceCsrf(request({ referer: "http://localhost:3000/lecturer", secFetchSite: "same-site" }))).toBeNull()
  })

  it("rejects cross-site mutations", async () => {
    const response = enforceCsrf(request({ origin: "https://attacker.example", secFetchSite: "cross-site" }))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: "CSRF validation failed" })
  })
})

