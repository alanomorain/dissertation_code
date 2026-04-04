import Redis from "ioredis"

const rateLimitStore = globalThis.__rateLimitStore || new Map()
if (!globalThis.__rateLimitStore) {
  globalThis.__rateLimitStore = rateLimitStore
}

const redisState = globalThis.__rateLimitRedisState || {
  client: null,
  disabled: false,
}
if (!globalThis.__rateLimitRedisState) {
  globalThis.__rateLimitRedisState = redisState
}

const REDIS_RATE_LIMIT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return { current, ttl }
`

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

function buildRateLimitResponse(retryAfterSeconds) {
  return Response.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  )
}

function enforceMemoryRateLimit(req, { scope, limit, windowMs, key }) {
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
    return buildRateLimitResponse(retryAfter)
  }

  existing.count += 1
  return null
}

function getRedisClient() {
  if (redisState.disabled) return null
  if (redisState.client) return redisState.client

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return null

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true,
  })

  client.on("error", (error) => {
    console.error("Redis rate limiter error:", error?.message || error)
  })

  redisState.client = client
  return redisState.client
}

async function enforceRedisRateLimit(req, { scope, limit, windowMs, key }) {
  const redis = getRedisClient()
  if (!redis) return null

  if (redis.status === "wait") {
    await redis.connect()
  }

  const bucketKey = `ratelimit:${scope}:${key || getClientIp(req)}`
  const result = await redis.eval(REDIS_RATE_LIMIT_SCRIPT, 1, bucketKey, windowMs)
  const [countRaw, ttlRaw] = Array.isArray(result) ? result : [0, 0]

  const count = Number(countRaw) || 0
  const ttlMs = Number(ttlRaw) || windowMs

  if (count > limit) {
    const retryAfter = Math.max(1, Math.ceil(ttlMs / 1000))
    return buildRateLimitResponse(retryAfter)
  }

  return null
}

export async function enforceRateLimit(req, options) {
  try {
    const redisResponse = await enforceRedisRateLimit(req, options)
    if (redisResponse) return redisResponse
  } catch (error) {
    console.error("Falling back to memory rate limiter:", error?.message || error)
    redisState.disabled = true
    if (redisState.client) {
      redisState.client.disconnect()
      redisState.client = null
    }
  }

  return enforceMemoryRateLimit(req, options)
}
