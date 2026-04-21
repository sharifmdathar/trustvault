import type { ArbitrationCase, Transaction, Vault } from '../../types';

export function connectWallet(): Promise<string>;
export function createVault(
  buyerAddress: string,
  sellerAddress: string,
  amount: string,
  description: string,
  deadlineDays: number,
): Promise<string>;
export function depositToVault(vaultId: string, buyerAddress: string): Promise<boolean>;
export function confirmVault(vaultId: string, callerAddress: string): Promise<boolean>;
export function flagDispute(vaultId: string, callerAddress: string): Promise<boolean>;
export function getVault(vaultId: string): Promise<Vault | null>;
export function getUserVaults(address: string): Promise<Vault[]>;
export function getRecentTransactions(): Promise<Transaction[]>;
export function getArbitrationCase(vaultId: string): Promise<ArbitrationCase | null>;
