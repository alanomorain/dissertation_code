const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])
const ALLOWED_FETCH_SITES = new Set(["same-origin", "same-site", "none"])

function toOrigin(value) {
  if (!value || typeof value !== "string") return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function getAllowedOrigins(req) {
  const origins = new Set()
  const requestOrigin = toOrigin(req.url)
  if (requestOrigin) origins.add(requestOrigin)

  const configuredOrigins = [process.env.APP_URL, process.env.NEXT_PUBLIC_APP_URL]
    .map((value) => toOrigin(value))
    .filter(Boolean)

  for (const origin of configuredOrigins) {
    origins.add(origin)
  }

  return origins
}

export function enforceCsrf(req) {
  const method = String(req.method || "").toUpperCase()
  if (SAFE_METHODS.has(method)) {
    return null
  }

  const secFetchSite = req.headers.get("sec-fetch-site")
  if (secFetchSite && !ALLOWED_FETCH_SITES.has(secFetchSite)) {
    return Response.json({ error: "CSRF validation failed" }, { status: 403 })
  }

  const allowedOrigins = getAllowedOrigins(req)
  const origin = toOrigin(req.headers.get("origin"))
  const referer = toOrigin(req.headers.get("referer"))

  if (origin && allowedOrigins.has(origin)) {
    return null
  }

  if (!origin && referer && allowedOrigins.has(referer)) {
    return null
  }

  return Response.json({ error: "CSRF validation failed" }, { status: 403 })
}
