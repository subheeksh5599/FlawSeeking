const agents = new Map<string, AgentData>()

export interface AgentData {
  address: string
  registered: boolean
  policyHash: string
  totalTxCount: number
  violationCount: number
  totalVolumeCspr: string
  paused: boolean
  createdAt: number
  policy: PolicyConfig
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  healthScore: number
}

export interface PolicyConfig {
  maxCsprPerTx: string
  maxCsprPerHour: string
  maxCsprPerDay: string
  cooldownSeconds: number
  allowlist: string[]
  blocklist: string[]
}

export interface ViolationRecord {
  id: number
  agent: string
  attemptedRecipient: string
  attemptedAmount: string
  blockReason: string
  timestamp: number
  resolved: boolean
  validatorVerdict: string | null
  reviewReasoning?: string
}

export interface ValidatorData {
  address: string
  active: boolean
  stakedAmount: string
  totalReviews: number
  correctVerdicts: number
  reputationScore: number
  joinedAt: number
}

export interface EcosystemStats {
  totalAgents: number
  totalValidators: number
  totalTransactions: number
  totalViolations: number
  activeViolations: number
  networkUptime: string
}

let violationIdCounter = 1
export const violations: ViolationRecord[] = []
export const validators: ValidatorData[] = []

export function seedData() {
  agents.set("01a3b5c7d9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5", {
    address: "01a3b5c7d9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5",
    registered: true,
    policyHash: "policy-hash-001",
    totalTxCount: 847,
    violationCount: 3,
    totalVolumeCspr: "12540",
    paused: false,
    createdAt: 1719781200,
    policy: { maxCsprPerTx: "50", maxCsprPerHour: "200", maxCsprPerDay: "1000", cooldownSeconds: 60, allowlist: [], blocklist: ["01dead0000dead0000dead0000dead0000dead"] },
    healthScore: 94.2,
    riskLevel: "LOW",
  })
  agents.set("01f4a2b8c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8", {
    address: "01f4a2b8c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8",
    registered: true,
    policyHash: "policy-hash-002",
    totalTxCount: 1203,
    violationCount: 12,
    totalVolumeCspr: "28940",
    paused: false,
    createdAt: 1719600000,
    policy: { maxCsprPerTx: "25", maxCsprPerHour: "100", maxCsprPerDay: "500", cooldownSeconds: 120, allowlist: [], blocklist: [] },
    healthScore: 78.5,
    riskLevel: "MEDIUM",
  })
  agents.set("01b000d000e000f000a000d0000000000dead", {
    address: "01b000d000e000f000a000d0000000000dead",
    registered: true,
    policyHash: "policy-hash-003",
    totalTxCount: 56,
    violationCount: 0,
    totalVolumeCspr: "340",
    paused: false,
    createdAt: 1719900000,
    policy: { maxCsprPerTx: "100", maxCsprPerHour: "500", maxCsprPerDay: "2000", cooldownSeconds: 0, allowlist: [], blocklist: [] },
    healthScore: 100,
    riskLevel: "LOW",
  })

  violations.push(
    {
      id: violationIdCounter,
      agent: "01a3b5c7d9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5",
      attemptedRecipient: "01dead0000dead0000dead0000dead0000dead",
      attemptedAmount: "500",
      blockReason: "TX_VALUE_EXCEEDS_MAX: 500 CSPR exceeds per-tx limit of 50 CSPR",
      timestamp: Date.now() - 120000,
      resolved: false,
      validatorVerdict: null,
    },
  )
  violationIdCounter++
  violations.push(
    {
      id: violationIdCounter,
      agent: "01f4a2b8c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8",
      attemptedRecipient: "01f4a2b8c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8",
      attemptedAmount: "75",
      blockReason: "COOLDOWN_ACTIVE: 23s remaining of 120s cooldown",
      timestamp: Date.now() - 60000,
      resolved: false,
      validatorVerdict: null,
    },
  )
  violationIdCounter++

  validators.push(
    { address: "01val00000000000000000000000000000001", active: true, stakedAmount: "5000", totalReviews: 142, correctVerdicts: 138, reputationScore: 97, joinedAt: 1719700000 },
    { address: "01val00000000000000000000000000000002", active: true, stakedAmount: "2500", totalReviews: 89, correctVerdicts: 72, reputationScore: 81, joinedAt: 1719750000 },
    { address: "01val00000000000000000000000000000003", active: true, stakedAmount: "10000", totalReviews: 312, correctVerdicts: 302, reputationScore: 96, joinedAt: 1719600000 },
  )
}

seedData()

export function getAgent(address: string): AgentData | undefined {
  return agents.get(address)
}

export function getAllAgents(): AgentData[] {
  return Array.from(agents.values())
}

export function createViolation(v: Omit<ViolationRecord, 'id' | 'timestamp' | 'resolved' | 'validatorVerdict'>): ViolationRecord {
  const record: ViolationRecord = {
    ...v,
    id: violationIdCounter++,
    timestamp: Date.now(),
    resolved: false,
    validatorVerdict: null,
  }
  violations.unshift(record)
  return record
}

export function resolveViolation(id: number, verdict: string, reasoning: string): ViolationRecord | null {
  const v = violations.find(v => v.id === id)
  if (v) {
    v.resolved = true
    v.validatorVerdict = verdict
    v.reviewReasoning = reasoning
  }
  return v ?? null
}

export function getEcosystemStats(): EcosystemStats {
  return {
    totalAgents: agents.size,
    totalValidators: 12,
    totalTransactions: 2841,
    totalViolations: violations.length,
    activeViolations: violations.filter(v => !v.resolved).length,
    networkUptime: "99.97%",
  }
}
