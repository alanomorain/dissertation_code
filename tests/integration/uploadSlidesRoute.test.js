import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  prisma: {
    module: {
      findFirst: vi.fn(),
    },
  },
  getCurrentUser: vi.fn(),
  enforceRateLimit: vi.fn(),
}))

vi.mock("../../app/lib/db.js", () => ({ prisma: mocks.prisma }))
vi.mock("../../app/lib/currentUser.js", () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock("../../app/lib/rateLimit.js", () => ({ enforceRateLimit: mocks.enforceRateLimit }))

const { POST } = await import("../../app/api/upload-slides/route.js")

function formRequest(formData) {
  return new Request("http://localhost:3000/api/upload-slides", {
    method: "POST",
    headers: {
      origin: "http://localhost:3000",
      "sec-fetch-site": "same-origin",
    },
    body: formData,
  })
}

function file({ type = "application/pdf", size = 12, name = "slides.pdf" } = {}) {
  return new File([new Uint8Array(size)], name, { type })
}

describe("/api/upload-slides", () => {
  beforeEach(() => {
    mocks.getCurrentUser.mockResolvedValue({ id: "lecturer-1" })
    mocks.enforceRateLimit.mockResolvedValue(null)
    mocks.prisma.module.findFirst.mockResolvedValue({ id: "module-1" })
  })

  it("rejects unauthenticated users before processing files", async () => {
    mocks.getCurrentUser.mockResolvedValue(null)
    const data = new FormData()
    data.set("file", file())
    data.set("moduleCode", "CSC7058")

    const response = await POST(formRequest(data))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
  })

  it("requires an uploaded file", async () => {
    const data = new FormData()
    data.set("moduleCode", "CSC7058")

    const response = await POST(formRequest(data))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "No file uploaded" })
  })

  it("rejects unsupported file types", async () => {
    const data = new FormData()
    data.set("file", file({ type: "text/plain", name: "notes.txt" }))
    data.set("moduleCode", "CSC7058")

    const response = await POST(formRequest(data))

    expect(response.status).toBe(415)
    await expect(response.json()).resolves.toEqual({
      error: "Unsupported file type. Please upload PDF or PPTX files.",
    })
  })

  it("requires a module code", async () => {
    const data = new FormData()
    data.set("file", file())

    const response = await POST(formRequest(data))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "moduleCode is required" })
  })

  it("rejects modules that do not belong to the lecturer", async () => {
    mocks.prisma.module.findFirst.mockResolvedValue(null)
    const data = new FormData()
    data.set("file", file())
    data.set("moduleCode", "CSC7058")

    const response = await POST(formRequest(data))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Unknown module for this lecturer" })
  })
})

