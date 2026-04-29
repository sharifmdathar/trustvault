import type { ArbitrationCase, Transaction, Vault } from "../../types";

export const NATIVE_XLM_CONTRACT_TESTNET: string;

export function getNativeTokenAddress(): string;
export function connectWallet(): Promise<string>;
export function createVault(
  buyerAddress: string,
  sellerAddress: string,
  amount: string,
  description: string,
  deadlineDays: number,
  arbitratorAddress: string,
): Promise<string>;
export function depositToVault(
  vaultId: string,
  buyerAddress: string,
  tokenAddress: string,
): Promise<{ txHash?: string }>;
export function confirmVault(
  vaultId: string,
  callerAddress: string,
  tokenAddress: string,
): Promise<{ txHash?: string }>;
export function flagDispute(
  vaultId: string,
  callerAddress: string,
  reason?: string,
): Promise<{ txHash?: string }>;
export function resolveDispute(
  vaultId: string,
  arbitratorAddress: string,
  decision: string,
  reason: string,
  tokenAddress: string,
): Promise<{ txHash?: string }>;
export function getVault(vaultId: string): Promise<Vault | null>;
export function getUserVaults(address: string): Promise<Vault[]>;
export function getAllVaults(): Promise<Vault[]>;
export function getRecentTransactions(): Promise<Transaction[]>;
export function getArbitrationCase(
  vaultId: string,
): Promise<ArbitrationCase | null>;
