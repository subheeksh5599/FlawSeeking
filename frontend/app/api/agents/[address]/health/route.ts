import { NextResponse } from "next/server"
import { getAgent } from "@/lib/data/store"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params
  const agent = getAgent(address)

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  return NextResponse.json({
    agent: agent.address,
    healthScore: agent.healthScore,
    totalTransactions: agent.totalTxCount,
    violations: agent.violationCount,
    activePolicy: agent.policy,
    riskLevel: agent.riskLevel,
    paused: agent.paused,
    createdAt: agent.createdAt,
  })
}
