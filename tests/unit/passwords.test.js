import { describe, expect, it } from "vitest"
import { hashPassword, verifyPassword } from "../../app/lib/passwords.js"

describe("password helpers", () => {
  it("verifies the original password and rejects a different password", async () => {
    const hash = await hashPassword("SP123!")

    expect(hash).toContain(":")
    expect(await verifyPassword("SP123!", hash)).toBe(true)
    expect(await verifyPassword("wrong-password", hash)).toBe(false)
  })

  it("rejects missing and malformed password hashes", async () => {
    expect(await verifyPassword("SP123!", "")).toBe(false)
    expect(await verifyPassword("SP123!", "not-a-valid-hash")).toBe(false)
  })
})

