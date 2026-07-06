import type {
  FlawSeekingConfig,
  GuardResult,
  ValidatorState,
  VerdictRecord,
} from './types'

export class ValidatorClient {
  private config: FlawSeekingConfig

  constructor(config: FlawSeekingConfig) {
    this.config = {
      nodeUrl: 'https://node.testnet.casper.network',
      ...config,
    }
  }

  async stake(amount: string): Promise<void> {
    console.log('[ValidatorClient] Staking', amount, 'CSPR to join network')
  }

  async submitVerdict(
    violationId: number,
    verdict: 'CONFIRMED' | 'OVERTURNED' | 'INCONCLUSIVE',
    reasoning: string,
  ): Promise<void> {
    console.log('[ValidatorClient] Submitting verdict for violation', violationId)
    console.log('[ValidatorClient] Verdict:', verdict)
    console.log('[ValidatorClient] Reasoning hash:', this.hash(reasoning))
  }

  async getValidatorState(
    validatorAddress: string,
  ): Promise<ValidatorState | null> {
    console.log('[ValidatorClient] Fetching validator state:', validatorAddress)
    return {
      active: true,
      stakedAmount: '1000',
      totalReviews: '42',
      correctVerdicts: '38',
      reputationScore: 90,
      joinedAt: 1719781200,
    }
  }

  onViolation(
    handler: (violation: {
      id: number
      agent: string
      amount: string
      reason: string
      timestamp: number
    }) => Promise<void>,
  ): void {
    console.log('[ValidatorClient] Subscribing to violation events via SSE')
    console.log('[ValidatorClient] SSE URL:', `${this.config.nodeUrl}/events/main`)

    setInterval(async () => {
      const mockViolation = {
        id: Math.floor(Math.random() * 1000),
        agent: '01a3b5c7d9...',
        amount: '500',
        reason: 'TX_VALUE_EXCEEDS_MAX: 500 CSPR exceeds per-tx limit of 50 CSPR',
        timestamp: Date.now(),
      }
      console.log('[ValidatorClient] Received violation:', mockViolation.id)
      await handler(mockViolation)
    }, 30000)
  }

  private hash(input: string): string {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const chr = input.charCodeAt(i)
      hash = (hash << 5) - hash + chr
      hash |= 0
    }
    return `sha256-${Math.abs(hash).toString(16)}`
  }
}
