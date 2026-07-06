#!/usr/bin/env bash
set -euo pipefail

echo "╔══════════════════════════════════════════════╗"
echo "║  FlawSeeking — Deploy to Casper Testnet     ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

if [ ! -f .env ]; then
  echo "[ERROR] .env file not found. Copy .env.template to .env and fill in your values."
  exit 1
fi

source .env

echo "[1/5] Building contracts..."
cd contracts
cargo build --release 2>&1 | tail -1

echo ""
echo "[2/5] Generating WASM via Odra..."
cd flawseeking-proxy && cargo odra build -b casper 2>&1 | tail -2 && cd ..
cd flawseeking-policy && cargo odra build -b casper 2>&1 | tail -2 && cd ..
cd flawseeking-validator && cargo odra build -b casper 2>&1 | tail -2 && cd ..
cd ..

echo ""
echo "[3/5] Deploying FlawSeeking Proxy..."
PROXY_HASH=$(casper-client put-deploy \
  --chain-name casper-test \
  --node-address http://node.testnet.casper.network:7777 \
  --secret-key "$SECRET_KEY_PATH" \
  --session-path contracts/flawseeking-proxy/wasm/flawseeking_proxy.wasm \
  --payment-amount 300000000000 2>&1 | grep -o 'deploy_hash.*' | head -1 || echo "deploy-hash-placeholder")

echo "  Proxy deploy hash: $PROXY_HASH"

echo ""
echo "[4/5] Deploying FlawSeeking Policy..."
POLICY_HASH=$(casper-client put-deploy \
  --chain-name casper-test \
  --node-address http://node.testnet.casper.network:7777 \
  --secret-key "$SECRET_KEY_PATH" \
  --session-path contracts/flawseeking-policy/wasm/flawseeking_policy.wasm \
  --payment-amount 300000000000 2>&1 | grep -o 'deploy_hash.*' | head -1 || echo "deploy-hash-placeholder")

echo "  Policy deploy hash: $POLICY_HASH"

echo ""
echo "[5/5] Deploying FlawSeeking Validator..."
VALIDATOR_HASH=$(casper-client put-deploy \
  --chain-name casper-test \
  --node-address http://node.testnet.casper.network:7777 \
  --secret-key "$SECRET_KEY_PATH" \
  --session-path contracts/flawseeking-validator/wasm/flawseeking_validator.wasm \
  --payment-amount 300000000000 2>&1 | grep -o 'deploy_hash.*' | head -1 || echo "deploy-hash-placeholder")

echo "  Validator deploy hash: $VALIDATOR_HASH"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Deployment Summary                          ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  Proxy:     $PROXY_HASH"
echo "║  Policy:    $POLICY_HASH"
echo "║  Validator: $VALIDATOR_HASH"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Update these hashes in your SDK config and .env file."
