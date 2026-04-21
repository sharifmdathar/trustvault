import * as StellarSdk from '@stellar/stellar-sdk';
import {
  isConnected,
  getPublicKey,
  signTransaction
} from '@stellar/freighter-api';

export const NETWORK = StellarSdk.Networks.TESTNET;
export const HORIZON_URL = import.meta.env.VITE_HORIZON_URL;
export const ESCROW_ID = import.meta.env.VITE_ESCROW_CONTRACT_ID;
export const ARBITRATION_ID = import.meta.env.VITE_ARBITRATION_CONTRACT_ID;

export const server = new StellarSdk.Horizon.Server(HORIZON_URL);

export async function connectWallet() {
  const connected = await isConnected();
  if (!connected) throw new Error('Please install Freighter');
  return await getPublicKey();
}

export async function createVault(
  buyerAddress,
  sellerAddress,
  amount,
  description,
  deadlineDays
) {
  // Contract invocation logic here
  // Returns vault ID
}

export async function depositToVault(vaultId, buyerAddress) {
  // Deposit XLM to vault
}

export async function confirmVault(vaultId, callerAddress) {
  // Confirm delivery
}

export async function flagDispute(vaultId, callerAddress) {
  // Flag dispute
}

export async function getVault(vaultId) {
  // Read vault from contract
}
