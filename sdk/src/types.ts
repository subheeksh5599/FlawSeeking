export interface AgentState {
  registered: boolean
  policyHash: string
  totalTxCount: string
  violationCount: string
  totalVolumeCspr: string
  paused: boolean
  createdAt: number
}

export interface PolicyConfig {
  maxCsprPerTx: string
  maxCsprPerHour: string
  maxCsprPerDay: string
  cooldownSeconds: number
  allowlist: string[]
  blocklist: string[]
}

export interface GuardResult {
  status: 'ALLOWED' | 'BLOCKED'
  reason: string
  violationId: number | null
  deployHash?: string
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
}

export interface ValidatorState {
  active: boolean
  stakedAmount: string
  totalReviews: string
  correctVerdicts: string
  reputationScore: number
  joinedAt: number
}

export interface VerdictRecord {
  id: number
  validator: string
  violationId: number
  verdict: 'CONFIRMED' | 'OVERTURNED' | 'INCONCLUSIVE'
  reasoningHash: string
  timestamp: number
}

export interface FlawSeekingConfig {
  network: 'testnet' | 'mainnet'
  keypairPath: string
  proxyContractHash: string
  policyContractHash?: string
  validatorContractHash?: string
  nodeUrl?: string
}

export interface AgentHealth {
  agent: string
  healthScore: number
  totalTransactions: number
  violations: number
  activePolicy: PolicyConfig | null
  lastViolation: ViolationRecord | null
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}
