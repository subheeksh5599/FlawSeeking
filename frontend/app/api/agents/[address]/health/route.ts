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
    address: agent.address,
    agent: agent.address,
    healthScore: agent.healthScore,
    totalTransactions: agent.totalTxCount,
    violations: agent.violationCount,
    totalVolumeCspr: agent.totalVolumeCspr,
    activePolicy: agent.policy,
    activePolicyHash: agent.policyHash,
    riskLevel: agent.riskLevel,
    paused: agent.paused,
    createdAt: agent.createdAt,
    registered: agent.registered,
  })
}
