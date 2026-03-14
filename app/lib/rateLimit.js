const rateLimitStore = globalThis.__rateLimitStore || new Map()
if (!globalThis.__rateLimitStore) {
  globalThis.__rateLimitStore = rateLimitStore
}

function nowMs() {
  return Date.now()
}

export function getClientIp(req) {
  const forwardedFor = req.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }

  const realIp = req.headers.get("x-real-ip")
  if (realIp) {
    return realIp.trim()
  }

  const cfIp = req.headers.get("cf-connecting-ip")
  if (cfIp) {
    return cfIp.trim()
  }

  return "unknown"
}

function pruneExpiredEntries(currentTime) {
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= currentTime) {
      rateLimitStore.delete(key)
    }
  }
}

export function enforceRateLimit(req, { scope, limit, windowMs, key }) {
  const currentTime = nowMs()
  if (rateLimitStore.size > 2000) {
    pruneExpiredEntries(currentTime)
  }

  const bucketKey = `${scope}:${key || getClientIp(req)}`
  const existing = rateLimitStore.get(bucketKey)

  if (!existing || existing.resetAt <= currentTime) {
    rateLimitStore.set(bucketKey, {
      count: 1,
      resetAt: currentTime + windowMs,
    })
    return null
  }

  if (existing.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - currentTime) / 1000))
    return Response.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
        },
      },
    )
  }

  existing.count += 1
  return null
}
