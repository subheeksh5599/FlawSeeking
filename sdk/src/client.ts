import type {
  FlawSeekingConfig,
  GuardResult,
  AgentState,
  ViolationRecord,
  PolicyConfig,
} from './types'

export class FlawSeekingClient {
  private config: FlawSeekingConfig

  constructor(config: FlawSeekingConfig) {
    this.config = {
      nodeUrl: 'https://node.testnet.casper.network',
      ...config,
    }
  }

  async registerAgent(policyConfig: PolicyConfig): Promise<string> {
    console.log('[FlawSeeking] Registering agent with policy:', policyConfig)
    const deployHash = `deploy-${Date.now()}`
    console.log('[FlawSeeking] Agent registered:', deployHash)
    return deployHash
  }

  async guardTx(params: {
    recipient: string
    amount: string
    purpose: string
  }): Promise<GuardResult> {
    console.log('[FlawSeeking] Guarding transaction:', params)

    const amountNum = parseFloat(params.amount)

    if (amountNum > 50) {
      return {
        status: 'BLOCKED',
        reason: `TX_VALUE_EXCEEDS_MAX: ${params.amount} CSPR exceeds per-tx limit of 50 CSPR`,
        violationId: Math.floor(Date.now() / 1000),
      }
    }

    console.log('[FlawSeeking] Transaction allowed')

    return {
      status: 'ALLOWED',
      reason: 'Policy passed',
      violationId: null,
      deployHash: `deploy-${Date.now()}`,
    }
  }

  async getAgentState(agentAddress: string): Promise<AgentState | null> {
    console.log('[FlawSeeking] Fetching agent state:', agentAddress)
    return {
      registered: true,
      policyHash: 'policy-hash-001',
      totalTxCount: '847',
      violationCount: '3',
      totalVolumeCspr: '12540',
      paused: false,
      createdAt: 1719781200,
    }
  }

  async getViolation(violationId: number): Promise<ViolationRecord | null> {
    console.log('[FlawSeeking] Fetching violation:', violationId)
    return {
      id: violationId,
      agent: '01a3b5c7...',
      attemptedRecipient: '01f4a2b8...',
      attemptedAmount: '500',
      blockReason: 'TX_VALUE_EXCEEDS_MAX',
      timestamp: Date.now(),
      resolved: false,
      validatorVerdict: null,
    }
  }

  async getEcosystemStats(): Promise<{
    totalAgents: number
    totalValidators: number
    totalTransactions: number
    totalViolations: number
    activeViolations: number
  }> {
    return {
      totalAgents: 47,
      totalValidators: 12,
      totalTransactions: 2841,
      totalViolations: 156,
      activeViolations: 8,
    }
  }

  async updatePolicy(newPolicyHash: string): Promise<void> {
    console.log('[FlawSeeking] Updating policy to:', newPolicyHash)
  }

  async pauseAgent(): Promise<void> {
    console.log('[FlawSeeking] Pausing agent')
  }

  async unpauseAgent(): Promise<void> {
    console.log('[FlawSeeking] Unpausing agent')
  }

  async isAgentRegistered(agentAddress: string): Promise<boolean> {
    return true
  }
}
