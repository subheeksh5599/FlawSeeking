export interface ViolationContext {
  id: number
  agent: string
  agentHistory: {
    totalTx: number
    violations: number
    avgTxSize: string
    daysActive: number
  }
  attemptedAmount: string
  attemptedRecipient: string
  blockReason: string
  policyLimits: {
    maxPerTx: string
    maxPerHour: string
    maxPerDay: string
    cooldownSeconds: number
  }
  timestamp: number
}

export interface ReviewResult {
  verdict: 'CONFIRMED' | 'OVERTURNED' | 'INCONCLUSIVE'
  confidence: number
  reasoning: string
  suggestedAction: string
}

const REVIEW_PROMPT = `You are a security auditor for the FlawSeeking agent economy on Casper Network.
Review the following blocked transaction and determine if the block was correct.

## Violation Details
- Violation ID: {{violationId}}
- Agent: {{agentAddress}}
- Attempted Amount: {{amount}} CSPR
- Block Reason: {{blockReason}}
- Policy Limit: {{policyLimit}} CSPR per transaction

## Agent History
- Total Transactions: {{totalTx}}
- Previous Violations: {{previousViolations}}
- Days Active: {{daysActive}}
- Risk Level: {{riskLevel}}

## Analysis Required
1. Was the block CORRECT (true positive — agent genuinely tried to exceed policy)?
2. Was the block OVERLY AGGRESSIVE (false positive — legitimate transaction caught by policy)?
3. Is there any evidence this was a malicious attempt (MEV extraction, drain attempt, etc.)?

Respond with a JSON object:
{
  "verdict": "CONFIRMED" | "OVERTURNED" | "INCONCLUSIVE",
  "confidence": 0-100,
  "reasoning": "Detailed analysis of the violation...",
  "suggestedAction": "What should happen next..."
}`

export async function reviewViolation(
  context: ViolationContext,
): Promise<ReviewResult> {
  const prompt = REVIEW_PROMPT
    .replace('{{violationId}}', String(context.id))
    .replace('{{agentAddress}}', context.agent)
    .replace('{{amount}}', context.attemptedAmount)
    .replace('{{blockReason}}', context.blockReason)
    .replace('{{policyLimit}}', context.policyLimits.maxPerTx)
    .replace('{{totalTx}}', String(context.agentHistory.totalTx))
    .replace('{{previousViolations}}', String(context.agentHistory.violations))
    .replace('{{daysActive}}', String(context.agentHistory.daysActive))
    .replace(
      '{{riskLevel}}',
      context.agentHistory.violations > 5 ? 'HIGH' : 'LOW',
    )

  console.log('[Reviewer] Sending to LLM for review...')

  const useLLM = process.env.OPENAI_API_KEY

  if (useLLM) {
    try {
      const { OpenAI } = await import('openai')
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a blockchain security auditor. Always respond with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      })

      const content = response.choices[0]?.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as ReviewResult
      }
    } catch (err) {
      console.error('[Reviewer] LLM call failed, using heuristic fallback:', err)
    }
  }

  console.warn('[Reviewer] No API key — using heuristic evaluation')

  const amount = parseFloat(context.attemptedAmount)
  const limit = parseFloat(context.policyLimits.maxPerTx)
  const ratio = amount / limit

  if (ratio > 5 && context.agentHistory.violations >= 3) {
    return {
      verdict: 'CONFIRMED',
      confidence: 95,
      reasoning: `Agent attempted ${amount} CSPR — ${ratio}x the ${limit} CSPR policy cap. With ${context.agentHistory.violations} prior violations, this is a high-confidence true positive.`,
      suggestedAction:
        'Keep block in place. Recommend agent review its policy or investigate for compromise.',
    }
  }

  if (ratio < 2 && context.agentHistory.violations === 0) {
    return {
      verdict: 'OVERTURNED',
      confidence: 70,
      reasoning: `Agent attempted ${amount} CSPR, only ${ratio.toFixed(1)}x over the ${limit} CSPR cap with zero prior violations. This may be a legitimate operation with a policy that is too restrictive.`,
      suggestedAction:
        'Overturn block. Recommend agent increase per-tx limit to accommodate normal operations.',
    }
  }

  return {
    verdict: 'CONFIRMED',
    confidence: 85,
    reasoning: `Agent attempted ${amount} CSPR which is ${ratio.toFixed(1)}x over the ${limit} CSPR limit. Block is correct per policy.`,
    suggestedAction:
      'Block stands. Agent should pre-authorize larger transactions through policy update.',
  }
}
