<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/subheeksh5599/FlawSeeking/main/.github/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/subheeksh5599/FlawSeeking/main/.github/logo-light.svg">
  <img alt="FlawSeeking" src="https://raw.githubusercontent.com/subheeksh5599/FlawSeeking/main/.github/logo-light.svg" width="520">
</picture>

<h3 align="center">The Programmable Security Layer for Casper's Agent Economy</h3>

<p align="center">
  <a href="https://github.com/subheeksh5599/FlawSeeking/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://odra.dev"><img src="https://img.shields.io/badge/odra-2.7.x-ff69b4" alt="Odra"></a>
  <a href="https://casper.network"><img src="https://img.shields.io/badge/network-casper--testnet-green" alt="Casper Testnet"></a>
  <a href="https://x402.org"><img src="https://img.shields.io/badge/payments-x402-orange" alt="x402"></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/protocol-MCP-purple" alt="MCP"></a>
</p>

---

## What is FlawSeeking?

FlawSeeking is the **shared security middleware** for autonomous AI agents on Casper Network. It is a programmable transaction proxy — deployed as Odra smart contracts — that sits between any AI agent and the blockchain. Every transaction an agent wants to execute must pass through FlawSeeking's policy engine first.

When a transaction violates policy, FlawSeeking **blocks it, logs the violation on-chain with full reasoning**, and optionally triggers a network of **independent AI validator agents** — each running different models and paid via x402 micropayments — to provide a second opinion.

> **"Every AI agent on Casper needs a seatbelt. FlawSeeking is the only one that fits every car."**

## The Problem

100+ projects are building AI agents that control on-chain funds in the Casper Agentic Buildathon. Every single one faces the same existential threat: **what happens when the agent goes rogue?** — hallucination, prompt injection, software bug, or simply bad reasoning.

Yet every team is building their own bespoke security layer. Cinder has 2-agent gates. Caspilot has a PolicyVault. **None of them interoperate. None share intelligence.** The ecosystem is reinventing the same wheel 100 times with no shared security surface.

FlawSeeking is that shared surface.

## Architecture

```
                   ┌─────────────────────────────────┐
                   │                                 │
    ┌──────────┐   │   ┌──────────────────────────┐  │
    │ ANY AI   │──cspR─→│  FlawSeeking Proxy       │  │
    │ AGENT    │   │   │  (Odra Contract)          │  │
    └──────────┘   │   │  ┌────────────────────┐   │  │
                   │   │  │ Policy Check        │   │  │
                   │   │  │ • Rate Limits       │   │  │
                   │   │  │ • Allowlist/Block   │   │  │
                   │   │  │ • Size Caps         │   │  │
                   │   │  │ • Cooldowns         │   │  │
                   │   │  │ • Multi-sig Gates   │   │  │
                   │   │  └────────┬───────────┘   │  │
                   │   │           │               │  │
                   │   │    ┌──────┴──────┐        │  │
                   │   │    │             │        │  │
                   │   │  ALLOW        BLOCK       │  │
                   │   │  tx fwd'd   violation     │  │
                   │   │  to chain   logged        │  │
                   │   │    │          │           │  │
                   │   └────┼──────────┼───────────┘  │
                   │        │          │              │
                   │        ▼          ▼              │
                   │   ┌─────────┐ ┌──────────────┐   │
                   │   │ Casper  │ │ Validator    │   │
                   │   │ Testnet │ │ Network      │   │
                   │   │    ✓    │ │              │   │
                   │   └─────────┘ │ Claude Agent │   │
                   │               │ GPT-4o Agent │   │
                   │               │ Gemini Agent │   │
                   │               │              │   │
                   │               │  paid via    │   │
                   │               │  x402 /call  │   │
                   │               └──────┬───────┘   │
                   │                      │           │
                   │            ┌─────────┴────────┐  │
                   │            │                  │  │
                   │        CONFIRMED          REJECTED │
                   │     (attest on-chain)  (slash)     │
                   └─────────────────────────────────┘
```

## How It Works

### 1. Register Your Agent

An AI agent enrolls with FlawSeeking by deploying (or referencing) a **policy contract** — a programmable rule set that defines what transactions are allowed:

```typescript
import { FlawSeeking } from '@flawseeking/sdk'

const fs = new FlawSeeking(agentKeypair)

await fs.registerAgent({
  policy: {
    maxCsprPerTx: '50',
    maxCsprPerDay: '200',
    allowlist: ['01a3b5c7...'],
    cooldownSeconds: 60,
  },
})
```

### 2. Agent Sends Transactions Through the Proxy

Every transaction goes through FlawSeeking instead of directly on-chain:

```typescript
// Instead of: casperClient.putDeploy(tx)
const result = await fs.guardTx({
  to: '01f4a2b8...',
  amount: '30',
  reason: 'Buy RWA price feed — x402 payment',
})
// → { status: 'ALLOWED', deployHash: 'e8f2...' }
```

### 3. Violations Are Blocked and Logged

When a transaction breaks policy, FlawSeeking blocks it and logs the violation immutably:

```typescript
const result = await fs.guardTx({
  to: '01f4a2b8...',
  amount: '500', // exceeds 50 CSPR/tx limit
})
// → {
//     status: 'BLOCKED',
//     reason: 'TX_VALUE_EXCEEDS_MAX',
//     violationId: 7,
//     policyLimit: '50',
//     requested: '500'
//   }
```

### 4. Validator Network Reviews Blocked Transactions

Independent AI agents — running different models (Claude, GPT-4o, Gemini) — subscribe to violation events via SSE, review each blocked transaction's context, and submit verdicts on-chain:

```typescript
// Validator agent receives violation event
{
  violationId: 7,
  agent: '01a3b5c7...',
  amount: '500',
  reason: 'Protection against MEV extraction',
  timestamp: '2026-07-05T14:23:01Z'
}

// GPT-4o reviews and submits:
await fs.submitVerdict({
  violationId: 7,
  verdict: 'CONFIRMED',        // The block was correct
  reasoning: 'Agent attempted 500 CSPR tx exceeding its 50 CSPR policy cap.
              No legitimate DeFi operation requires 10x normal transaction
              size within a 60s cooldown window.'
})
```

### 5. Validators Get Paid via x402

Each review is an x402-payable action. Validators stake CSPR to join the network and earn fees per review. Bad validators get slashed.

```typescript
// Validator stakes to join
await fs.stakeValidator('1000')

// Gets paid per review via x402
// Payment: 0.001 CSPR per verdict
// Settled on-chain with cryptographic proof
```

## Policy Types

| Policy | Description | Example |
|--------|-------------|---------|
| **Rate Limit** | Max CSPR per time window | 50 CSPR/hour, 200 CSPR/day |
| **Allowlist** | Only send to approved addresses | Whitelist: known AMM routers |
| **Blocklist** | Never send to blocked addresses | Blacklist: known phishing |
| **Size Cap** | Max value per single transaction | ≤ 10 CSPR per tx |
| **Cooldown** | Minimum time between txs | 60 seconds between sends |
| **Multi-Sig** | N-of-M agent sign-off required | 3-of-5 treasury agent quorum |
| **Anomaly Detection** | Statistical outlier flagging | 3σ above 30-day moving average |

Policies are **upgradeable** — an agent can tighten or loosen its policy at any time. Future policies can be deployed as new smart contracts without migrating agents.

## Repository Structure

```
flawseeking/
├── contracts/                    # Odra Rust → WASM smart contracts
│   ├── flawseeking-proxy/        # Main transaction proxy
│   │   └── src/
│   │       ├── lib.rs            # Contract entry points
│   │       └── events.rs         # Violation + attestation events
│   ├── flawseeking-policy/       # Pluggable policy contracts
│   │   └── src/
│   │       └── lib.rs            # Policy rules + evaluation engine
│   ├── flawseeking-validator/    # Validator staking + slashing
│   │   └── src/
│   │       └── lib.rs            # Reputation + verdict submission
│   └── Cargo.toml                # Rust workspace
├── sdk/                          # TypeScript SDK
│   ├── package.json
│   └── src/
│       ├── index.ts              # Main entry point
│       ├── client.ts             # FlawSeeking client
│       ├── proxy.ts              # Transaction guard interface
│       ├── validator.ts          # Validator client
│       └── types.ts              # TypeScript type definitions
├── mcp/                          # Model Context Protocol Server
│   ├── package.json
│   └── src/
│       └── index.ts              # MCP tools for AI agent queries
├── validator-agent/              # Autonomous validator agent
│   ├── package.json
│   └── src/
│       ├── index.ts              # Entry point + SSE subscriber
│       └── reviewer.ts           # LLM-based violation reviewer
├── ai-saas/                      # Frontend landing page
│   └── src/                      # Dashboard UI
├── scripts/
│   ├── deploy.sh                 # Contract deployment to testnet
│   └── demo.sh                   # End-to-end demo script
├── .gitignore
└── README.md
```

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Smart Contracts | Odra 2.7.x (Rust → WASM) | Stable pricing mode on Casper Testnet |
| Deployment | casper-client 1.5.x | Classic pricing compatible |
| SDK | TypeScript + casper-js-sdk v5 | MCP + agent compatibility |
| MCP Server | @modelcontextprotocol/sdk | Standard AI agent interface |
| Validator Agent | TypeScript + OpenAI/Anthropic SDK | Multi-model violation review |
| Micropayments | x402 protocol via casper-x402 | HTTP-native agent-to-agent payments |
| Event Streaming | SSE via node.testnet.casper.network | Real-time violation detection |
| APIs | CSPR.cloud | Enterprise-grade blockchain queries |
| Frontend | Next.js + Tailwind CSS | Agent health dashboard |

## Quick Start

### Prerequisites

- Rust 1.75+
- Node.js 20+
- [Odra Framework](https://odra.dev/docs/getting-started/installation)
- [casper-client 1.5.x](https://docs.casper.network)
- Casper Testnet account (funded via [faucet](https://testnet.cspr.live/tools/faucet))

### Install Dependencies

```bash
# Rust contracts
cd contracts
cargo build

# TypeScript SDK
cd ../sdk
npm install

# MCP Server
cd ../mcp
npm install

# Validator Agent
cd ../validator-agent
npm install
```

### Deploy Contracts to Testnet

```bash
# Set environment
cp .env.template .env
# Edit .env with your testnet keypair path

# Build & deploy
./scripts/deploy.sh
```

### Run the Demo

```bash
./scripts/demo.sh
```

## SDK Usage

### For AI Agents (Integrating FlawSeeking)

```typescript
import { FlawSeeking } from '@flawseeking/sdk'
import { CasperClient } from 'casper-js-sdk'

const client = new FlawSeeking({
  network: 'testnet',
  keypair: loadKeypair('./keys/agent.pem'),
  proxyContractHash: 'hash-e8f2...',
})

// Register agent with a policy
await client.registerAgent({ maxCsprPerTx: '50', cooldownSeconds: 60 })

// Execute a guarded transaction
const result = await client.guardTx({
  recipient: '01f4a2b8c3...',
  amount: '30',
  purpose: 'x402 payment for market data',
})

if (result.status === 'ALLOWED') {
  console.log(`Tx ${result.deployHash} confirmed`)
} else {
  console.error(`Blocked: ${result.reason}`)
}
```

### For Validator Agents (Joining the Network)

```typescript
import { ValidatorClient } from '@flawseeking/sdk'

const validator = new ValidatorClient({
  network: 'testnet',
  keypair: loadKeypair('./keys/validator.pem'),
})

// Stake to join
await validator.stake('1000') // 1000 CSPR

// Subscribe to violations
validator.onViolation(async (violation) => {
  const verdict = await reviewWithLLM(violation)
  await validator.submitVerdict(violation.id, verdict)
})

// Earn x402 fees for each review
```

## MCP Server

AI agents can query FlawSeeking state through natural language via the MCP server:

```json
// Claude/GPT/Cursor asks:
"Show me the health of agent 01a3b5c7"

// MCP Server responds:
{
  "agent": "01a3b5c7d9...",
  "health": 94.2,
  "totalTransactions": 847,
  "violations": 3,
  "activePolicy": { "maxCsprPerTx": "50", "cooldownSeconds": 60 },
  "lastViolation": "2026-07-05T14:23:01Z",
  "riskLevel": "LOW"
}
```

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `getAgentHealth` | Policy compliance rate, recent violations, risk level |
| `getPendingViolations` | Violations awaiting validator review |
| `getValidatorReputation` | Validator score, history, stake amount |
| `getPolicyFor` | Active policy rules for an agent |
| `getEcosystemStats` | Total agents, validators, transactions, security events |

## Judging Criteria Alignment

| Criterion | How FlawSeeking Scores |
|-----------|----------------------|
| **Technical Execution** | Odra upgradeable contracts, WASM engine, TypeScript SDK, MCP server, x402 integration |
| **Innovation & Originality** | First **shared** security middleware for agent economies — no one else is building ecosystem infrastructure |
| **Use of AI / Agentic Systems** | Validator network uses 3 different LLMs; anomaly detection uses ML; policy evaluation is AI-assistable |
| **Real-World Applicability** | *Every* agent project in the hackathon needs this — it's a missing piece of ecosystem infra |
| **User Experience & Design** | Clean dashboard showing agent health, violation feed, validator status |
| **Working Smart Contracts** | All 3 contracts deploy on Casper Testnet with real transactions |
| **Long-Term Launch Plans** | Become the default security layer every Casper agent integrates; premium validator marketplace |
| **Potential for Long-Term Impact** | Raises the security floor for the entire Casper agent economy |

## Roadmap

| Phase | Milestone | Status |
|-------|-----------|--------|
| **Buildathon** | Deploy proxy + policy + validator on testnet | 🚧 Building |
| **Buildathon** | Ship TypeScript SDK + MCP server | 🚧 Building |
| **Buildathon** | Launch validator network with 3 AI agents | 🚧 Building |
| **Q3 2026** | Integrate with 10+ agent projects | 📋 Planned |
| **Q4 2026** | Mainnet launch with premium validator market | 📋 Planned |
| **Q1 2027** | Cross-chain policy enforcement (EVM, Solana) | 📋 Planned |

## License

MIT © 2026 FlawSeeking
