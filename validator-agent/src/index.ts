import 'dotenv/config'
import { ValidatorClient } from '@flawseeking/sdk'
import { reviewViolation } from './reviewer.js'

async function main() {
  console.log('┌────────────────────────────────────────────────┐')
  console.log('│  FlawSeeking Validator Agent                   │')
  console.log('│  Autonomous security reviewer for Casper agents │')
  console.log('└────────────────────────────────────────────────┘')
  console.log()

  const agent = process.env.AGENT_NAME || `validator-${process.pid}`
  console.log(`[Identity] ${agent}`)
  console.log(`[Model] ${process.env.OPENAI_API_KEY ? 'GPT-4o (live)' : 'Heuristic (demo)'}`)

  if (!process.env.VALIDATOR_KEYPAIR_PATH) {
    console.warn('[Warning] VALIDATOR_KEYPAIR_PATH not set — running in demo mode')
  }

  const client = new ValidatorClient({
    network: 'testnet',
    keypairPath: process.env.VALIDATOR_KEYPAIR_PATH || './keys/validator.pem',
    proxyContractHash:
      process.env.PROXY_CONTRACT_HASH || 'hash-proxy-placeholder',
    validatorContractHash:
      process.env.VALIDATOR_CONTRACT_HASH || 'hash-validator-placeholder',
  })

  console.log('[Status] Connected to Casper Testnet')
  console.log('[Status] Waiting for violation events...')
  console.log()

  let reviewCount = 0

  client.onViolation(async (violation) => {
    console.log(`\n─── Violation #${violation.id} ───`)
    console.log(`  Agent:     ${violation.agent}`)
    console.log(`  Amount:    ${violation.amount} CSPR`)
    console.log(`  Reason:    ${violation.reason}`)
    console.log(`  Time:      ${new Date(violation.timestamp).toISOString()}`)
    console.log()

    console.log('  [Reviewer] Analyzing...')
    const result = await reviewViolation({
      id: violation.id,
      agent: violation.agent,
      agentHistory: {
        totalTx: 847,
        violations: Math.floor(Math.random() * 5),
        avgTxSize: '12',
        daysActive: 14,
      },
      attemptedAmount: violation.amount,
      attemptedRecipient: '01f4a2b8...',
      blockReason: violation.reason,
      policyLimits: {
        maxPerTx: '50',
        maxPerHour: '200',
        maxPerDay: '1000',
        cooldownSeconds: 60,
      },
      timestamp: violation.timestamp,
    })

    console.log(`  ┌─ Verdict ──────────────────────────────`)
    console.log(`  │ ${result.verdict} (${result.confidence}% confidence)`)
    console.log(`  │ ${result.reasoning}`)
    console.log(`  │ ${result.suggestedAction}`)
    console.log(`  └───────────────────────────────────────────`)

    console.log(`\n  [On-chain] Submitting verdict to Casper Testnet...`)
    await client.submitVerdict(
      violation.id,
      result.verdict,
      result.reasoning,
    )

    reviewCount++
    console.log(`  [Done] Total reviews: ${reviewCount}\n`)
  })
}

main().catch((err) => {
  console.error('[FATAL]', err)
  process.exit(1)
})
