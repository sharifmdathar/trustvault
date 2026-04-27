#!/usr/bin/env bash
set -e

NETWORK=testnet
DEPLOYER=admin

echo "=== Building Arbitration Contract ==="
cd contracts/arbitration
stellar contract build
ARBT_WASM=$(find target -name "*.wasm" | grep -v ".cargo" | head -1)
echo "Arbitration WASM: $ARBT_WASM"

echo ""
echo "=== Deploying Arbitration Contract ==="
ARB_ID=$(stellar contract deploy \
  --wasm "$ARBT_WASM" \
  --source "$DEPLOYER" \
  --network "$NETWORK")
echo "Arbitration Contract ID: $ARB_ID"

echo ""
echo "=== Initializing Arbitration Contract ==="
stellar contract invoke \
  --id "$ARB_ID" \
  --source "$DEPLOYER" \
  --network "$NETWORK" \
  -- initialize \
  --admin "$(stellar keys address admin)"

echo ""
echo "=== Building Escrow Contract ==="
cd ../escrow
stellar contract build
ESCROW_WASM=$(find target -name "*.wasm" | grep -v ".cargo" | head -1)
echo "Escrow WASM: $ESCROW_WASM"

echo ""
echo "=== Deploying Escrow Contract ==="
ESCROW_ID=$(stellar contract deploy \
  --wasm "$ESCROW_WASM" \
  --source "$DEPLOYER" \
  --network "$NETWORK")
echo "Escrow Contract ID: $ESCROW_ID"

echo ""
echo "=== Initializing Escrow Contract ==="
stellar contract invoke \
  --id "$ESCROW_ID" \
  --source "$DEPLOYER" \
  --network "$NETWORK" \
  -- initialize \
  --admin "$(stellar keys address admin)" \
  --arbitration_contract "$ARB_ID"

echo ""
echo "=== Getting Native XLM SAC Address ==="
XLM_SAC=$(stellar contract id asset \
  --asset native \
  --network "$NETWORK" 2>/dev/null || echo "unavailable")
echo "Native XLM SAC: $XLM_SAC"

echo ""
echo "============================================"
echo "          UPDATE frontend/.env              "
echo "============================================"
echo "VITE_ESCROW_CONTRACT_ID=$ESCROW_ID"
echo "VITE_ARBITRATION_CONTRACT_ID=$ARB_ID"
if [ "$XLM_SAC" != "unavailable" ]; then
  echo "VITE_NATIVE_TOKEN_ADDRESS=$XLM_SAC"
fi
echo "============================================"
echo ""
echo "Copy the above into frontend/.env and restart: bun dev"
