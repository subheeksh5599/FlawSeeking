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

const REVIEW_PROMPT = `You are a security auditor for FlawSeeking on Casper Network. Review blocked transactions.

## Violation
- ID: {{violationId}}
- Agent: {{agentAddress}}
- Amount: {{amount}} CSPR
- Block Reason: {{blockReason}}
- Policy Limit: {{policyLimit}} CSPR/tx

## Agent History
- Total Txs: {{totalTx}}
- Prior Violations: {{previousViolations}}
- Days Active: {{daysActive}}

Respond with ONLY a JSON object, no other text:
{"verdict":"CONFIRMED"|"OVERTURNED"|"INCONCLUSIVE","confidence":0-100,"reasoning":"...","suggestedAction":"..."}`

export async function reviewViolation(
  context: ViolationContext,
  apiKey?: string,
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

  if (apiKey) {
    try {
      const Groq = (await import('groq-sdk')).default
      const groq = new Groq({ apiKey })

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a blockchain security auditor. Respond ONLY with valid JSON. No markdown, no extra text.' },
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
      throw new Error('No JSON in response')
    } catch (err) {
      console.warn('[Reviewer] LLM call failed, falling back to heuristic:', String(err).slice(0, 80))
    }
  }

  const amount = parseFloat(context.attemptedAmount)
  const limit = parseFloat(context.policyLimits.maxPerTx)
  const ratio = amount / limit

  if (ratio > 5 && context.agentHistory.violations >= 3) {
    return {
      verdict: 'CONFIRMED',
      confidence: 95,
      reasoning: `Agent attempted ${amount} CSPR — ${ratio.toFixed(0)}x the ${limit} CSPR policy cap. With ${context.agentHistory.violations} prior violations, high-confidence true positive.`,
      suggestedAction: 'Keep block. Recommend agent policy review or compromise investigation.',
    }
  }

  if (ratio < 2 && context.agentHistory.violations === 0) {
    return {
      verdict: 'OVERTURNED',
      confidence: 70,
      reasoning: `Agent attempted ${amount} CSPR, ${ratio.toFixed(1)}x over ${limit} CSPR cap with zero priors. Possible legitimate operation caught by overly restrictive policy.`,
      suggestedAction: 'Overturn block. Recommend increasing per-tx limit.',
    }
  }

  return {
    verdict: 'CONFIRMED',
    confidence: 85,
    reasoning: `Agent attempted ${amount} CSPR (${ratio.toFixed(1)}x over ${limit} CSPR limit). Block correct per policy.`,
    suggestedAction: 'Block stands. Agent should pre-authorize larger txs through policy update.',
  }
}
