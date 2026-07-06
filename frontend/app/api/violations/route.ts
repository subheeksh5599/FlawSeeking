import { NextResponse } from "next/server"
import { violations, resolveViolation, createViolation, getEcosystemStats } from "@/lib/data/store"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const resolved = searchParams.get("resolved")
  const agent = searchParams.get("agent")

  let result = [...violations]

  if (resolved === "true") result = result.filter(v => v.resolved)
  if (resolved === "false") result = result.filter(v => !v.resolved)
  if (agent) result = result.filter(v => v.agent === agent)

  return NextResponse.json({
    violations: result,
    total: result.length,
    ecosystem: getEcosystemStats(),
  })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, verdict, reasoning } = body

  if (!id || !verdict) {
    return NextResponse.json({ error: "Missing id or verdict" }, { status: 400 })
  }

  const resolved = resolveViolation(id, verdict, reasoning)
  if (!resolved) {
    return NextResponse.json({ error: "Violation not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true, violation: resolved })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { agent, attemptedRecipient, attemptedAmount, blockReason } = body

  if (!agent || !attemptedAmount || !blockReason) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const violation = createViolation({ agent, attemptedRecipient: attemptedRecipient || "unknown", attemptedAmount, blockReason })
  return NextResponse.json({ success: true, violation }, { status: 201 })
}
