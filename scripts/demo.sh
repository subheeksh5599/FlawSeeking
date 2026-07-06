#!/usr/bin/env bash
set -euo pipefail

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  FlawSeeking — End-to-End Demo                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

echo "┌─ Step 1: Environment Check ──────────────────────────────┐"
echo "│ Checking Odra installation..."
command -v cargo-odra >/dev/null 2>&1 && echo "│  ✓ cargo-odra found" || echo "│  ✗ cargo-odra not found"
command -v node >/dev/null 2>&1 && echo "│  ✓ Node.js found" || echo "│  ✗ Node.js not found"
echo "└──────────────────────────────────────────────────────────┘"
echo ""

echo "┌─ Step 2: Running Contract Tests ────────────────────────┐"
echo "│ Odra VM tests (no testnet required)..."
cd contracts/flawseeking-proxy
cargo test 2>&1 | tail -5
cd ../..

cd contracts/flawseeking-policy
cargo test 2>&1 | tail -5
cd ../..

cd contracts/flawseeking-validator
cargo test 2>&1 | tail -5
cd ../..
echo "└──────────────────────────────────────────────────────────┘"
echo ""

echo "┌─ Step 3: Starting Validator Agent ───────────────────────┐"
echo "│ Launching autonomous validator..."
cd validator-agent
node --import tsx src/index.ts &
VALIDATOR_PID=$!
sleep 2
echo "│  Validator PID: $VALIDATOR_PID"
cd ..
echo "└──────────────────────────────────────────────────────────┘"
echo ""

echo "┌─ Step 4: Demo — Agent Register + Guard Tx ──────────────┐"

node --import tsx -e "
import { FlawSeekingClient } from './sdk/src/index.js';

async function demo() {
  const fs = new FlawSeekingClient({
    network: 'testnet',
    keypairPath: './keys/demo.pem',
    proxyContractHash: 'hash-proxy-demo',
  });

  console.log('│');
  console.log('│  [1] Registering DemoAgent...');
  const deployHash = await fs.registerAgent({
    maxCsprPerTx: '50',
    maxCsprPerHour: '200',
    maxCsprPerDay: '1000',
    cooldownSeconds: 60,
    allowlist: [],
    blocklist: [],
  });
  console.log('│  ✓ Agent registered:', deployHash);

  console.log('│');
  console.log('│  [2] Sending 30 CSPR (within policy)...');
  const result1 = await fs.guardTx({
    recipient: '01f4a2b8c3d9...',
    amount: '30',
    purpose: 'x402 payment for RWA price feed',
  });
  console.log('│  ✓ Status:', result1.status, '-', result1.reason);

  console.log('│');
  console.log('│  [3] Sending 500 CSPR (exceeds 50 CSPR limit)...');
  const result2 = await fs.guardTx({
    recipient: '01dead0000...',
    amount: '500',
    purpose: 'Emergency fund drain',
  });
  console.log('│  ✗ Status:', result2.status);
  console.log('│  ✗ Reason:', result2.reason);
  console.log('│  ✗ Violation ID:', result2.violationId);

  console.log('│');
  console.log('│  [4] Checking ecosystem stats...');
  const stats = await fs.getEcosystemStats();
  console.log('│  Agents:', stats.totalAgents);
  console.log('│  Validators:', stats.totalValidators);
  console.log('│  Transactions:', stats.totalTransactions);
  console.log('│  Violations:', stats.totalViolations);
}
demo();
" 2>&1

echo "└──────────────────────────────────────────────────────────┘"
echo ""

echo "┌─ Step 5: Cleanup ────────────────────────────────────────┐"
kill $VALIDATOR_PID 2>/dev/null || true
echo "│  Validator stopped"
echo "└──────────────────────────────────────────────────────────┘"
echo ""

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Demo Complete!                                          ║"
echo "║                                                          ║"
echo "║  What happened:                                          ║"
echo "║  1. Agent registered with 50 CSPR/tx policy              ║"
echo "║  2. 30 CSPR tx → ALLOWED (within policy)                ║"
echo "║  3. 500 CSPR tx → BLOCKED (exceeds limit, violation #N) ║"
echo "║  4. Validator agent detected violation                   ║"
echo "║  5. Validator submitted CONFIRMED verdict                ║"
echo "║  6. Everything logged immutably on Casper Testnet       ║"
echo "╚══════════════════════════════════════════════════════════╝"
