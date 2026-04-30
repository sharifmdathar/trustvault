import * as StellarSdk from "@stellar/stellar-sdk";
import * as freighterApiModule from "@stellar/freighter-api";
import type { Vault, Transaction, ArbitrationCase } from "../../types";

const {
  Address,
  BASE_FEE,
  Contract,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  rpc,
} = StellarSdk;
export { scValToNative };

// Handle potential default export wrapping
const freighterApi =
  (freighterApiModule as unknown as { default?: typeof freighterApiModule })
    .default || freighterApiModule;
const { getAddress, isConnected, requestAccess, signTransaction, getNetwork } =
  freighterApi as {
    getAddress: () => Promise<FreighterAddressResponse>;
    isConnected: () => Promise<FreighterConnectionResponse>;
    requestAccess: () => Promise<FreighterAddressResponse>;
    signTransaction: (
      xdr: string,
      opts: { networkPassphrase: string },
    ) => Promise<FreighterSignResponse>;
    getNetwork: () => Promise<FreighterNetworkResponse>;
  };

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

/** Keys in the ENV config object (must match VITE_ prefixed env vars). */
type EnvKey =
  | "VITE_ARBITRATION_CONTRACT_ID"
  | "VITE_ESCROW_CONTRACT_ID"
  | "VITE_NETWORK"
  | "VITE_NETWORK_PASSPHRASE"
  | "VITE_SOROBAN_URL";

/** Freighter error payload — can be string or object. */
type FreighterError = string | { message?: string; [key: string]: unknown };

interface FreighterConnectionResponse {
  isConnected?: boolean;
  networkPassphrase?: string;
  passphrase?: string;
  network?: string;
  error?: FreighterError;
}

interface FreighterAddressResponse {
  address?: string;
  error?: FreighterError;
}

interface FreighterSignResponse {
  signedTxXdr?: string;
  error?: FreighterError;
}

interface FreighterNetworkResponse {
  networkPassphrase?: string;
  passphrase?: string;
  network?: string;
}

/**
 * Raw Soroban vault data as returned by `scValToNative`.
 * The shapes come directly from the Rust contract struct — we accept `unknown`
 * at the boundary and validate/cast field-by-field in `nativeVaultToUiVault`.
 */
interface RawNativeVault {
  id?: unknown;
  buyer?: unknown;
  seller?: unknown;
  arbitrator?: unknown;
  amount?: unknown;
  description?: unknown;
  status?: unknown;
  deadline?: unknown;
  buyer_confirmed?: unknown;
  seller_confirmed?: unknown;
}

interface RawNativeCase {
  vault_id?: unknown;
  arbitrator?: unknown;
  decision?: unknown;
  reason?: unknown;
  timestamp?: unknown;
}

/** Persistent transaction record written to localStorage. */
interface TransactionRecord
  extends Omit<Transaction, "id" | "timestamp" | "status"> {
  id?: string;
  timestamp?: string;
  status?: Transaction["status"];
}

/** Return shape from `checkSponsorBalance`. */
export interface SponsorBalance {
  address: string | undefined;
  balance: number;
  sufficient: boolean;
  exists: boolean;
  error?: string;
}

/** Return shape from `submitSponsoredContractCall`. */
export interface SponsoredCallResult {
  txHash: string;
  returnValue: unknown;
  status: string;
  resultMetaXdr?: unknown;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRANSACTIONS_KEY = "trustvault:transactions";
const VAULT_METADATA_KEY = "trustvault:vault-metadata";
const READONLY_SOURCE_ACCOUNT =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const STROOPS_PER_XLM = 10_000_000n;

/** Native XLM Stellar Asset Contract on Testnet */
export const NATIVE_XLM_CONTRACT_TESTNET =
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

const MAX_RPC_POLL_ATTEMPTS = 30;
const RPC_POLL_INTERVAL_MS = 1_000;

const ENV: Record<EnvKey, string | undefined> = {
  VITE_ARBITRATION_CONTRACT_ID: import.meta.env.VITE_ARBITRATION_CONTRACT_ID,
  VITE_ESCROW_CONTRACT_ID: import.meta.env.VITE_ESCROW_CONTRACT_ID,
  VITE_NETWORK: import.meta.env.VITE_NETWORK,
  VITE_NETWORK_PASSPHRASE: import.meta.env.VITE_NETWORK_PASSPHRASE,
  VITE_SOROBAN_URL: import.meta.env.VITE_SOROBAN_URL,
};

const isBrowser = typeof window !== "undefined";

// ---------------------------------------------------------------------------
// Decision map — exhaustive for `resolveDispute`
// ---------------------------------------------------------------------------

type DisputeDecision = "buyer" | "seller" | "split";
const DECISION_CONTRACT_MAP: Record<DisputeDecision, string> = {
  buyer: "ReleaseToBuyer",
  seller: "ReleaseToSeller",
  split: "SplitFiftyFifty",
};

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
  }
}

function getTransactions(): Transaction[] {
  return readJson<Transaction[]>(TRANSACTIONS_KEY, []);
}

function saveTransactions(transactions: Transaction[]): void {
  writeJson(TRANSACTIONS_KEY, transactions);
}

function recordTransaction(transaction: TransactionRecord): void {
  saveTransactions([
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
      status: "success",
      ...transaction,
    } as Transaction,
    ...getTransactions(),
  ]);
}

type VaultMetadataStore = Record<
  string,
  { description?: string; createdAt?: string }
>;

function readVaultMetadata(): VaultMetadataStore {
  return readJson<VaultMetadataStore>(VAULT_METADATA_KEY, {});
}

function writeVaultMetadata(metadata: VaultMetadataStore): void {
  writeJson(VAULT_METADATA_KEY, metadata);
}

function rememberVaultMetadata(
  vaultId: string | number,
  metadata: { description?: string; createdAt?: string },
): void {
  const currentMetadata = readVaultMetadata();
  const id = String(vaultId);
  writeVaultMetadata({
    ...currentMetadata,
    [id]: {
      ...currentMetadata[id],
      ...metadata,
    },
  });
}

// ---------------------------------------------------------------------------
// Env / config helpers
// ---------------------------------------------------------------------------

function getEnv(name: EnvKey): string | undefined {
  return ENV[name];
}

function isPlaceholder(value: string | undefined | null): boolean {
  return !value || value.startsWith("your_") || value.includes("<");
}

function getNetworkPassphrase(): string {
  const configuredPassphrase = getEnv("VITE_NETWORK_PASSPHRASE");
  if (configuredPassphrase) return configuredPassphrase;

  const configuredNetwork = (
    getEnv("VITE_NETWORK") || "testnet"
  ).toLowerCase();
  if (configuredNetwork === "public" || configuredNetwork === "mainnet")
    return Networks.PUBLIC;
  if (configuredNetwork === "futurenet") return Networks.FUTURENET;
  return Networks.TESTNET;
}

function getRpcUrl(): string {
  return getEnv("VITE_SOROBAN_URL") || "https://soroban-testnet.stellar.org";
}

export function getServer(): StellarSdk.rpc.Server {
  return new rpc.Server(getRpcUrl());
}

export function requireContractId(name: EnvKey): string {
  const value = getEnv(name);
  if (isPlaceholder(value)) {
    throw new Error(
      `Missing ${name}. Set it in .env before interacting with TrustVault contracts.`,
    );
  }
  // isPlaceholder guards undefined/empty, so value is a non-empty string here
  return value as string;
}

function getOptionalContractId(name: EnvKey): string | null {
  const value = getEnv(name);
  return isPlaceholder(value) ? null : (value as string);
}

function hasEscrowContract(): boolean {
  return Boolean(getOptionalContractId("VITE_ESCROW_CONTRACT_ID"));
}

export const horizonServer = new StellarSdk.Horizon.Server(
  getNetworkPassphrase() === Networks.PUBLIC
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org",
);

export const ESCROW_ID = getOptionalContractId("VITE_ESCROW_CONTRACT_ID");

// ---------------------------------------------------------------------------
// Network helpers
// ---------------------------------------------------------------------------

/** Returns the native XLM token contract address for the current network. */
export function getNativeTokenAddress(): string {
  const fromEnv =
    typeof import.meta !== "undefined" &&
    (import.meta.env?.VITE_NATIVE_TOKEN_ADDRESS as string | undefined);
  return (
    fromEnv ||
    (getNetworkPassphrase() === Networks.PUBLIC
      ? StellarSdk.Asset.native().contractId(Networks.PUBLIC)
      : StellarSdk.Asset.native().contractId(Networks.TESTNET))
  );
}

function networkLabelFromPassphrase(passphrase: string | null): string {
  if (!passphrase) return "Unknown";
  if (passphrase === Networks.TESTNET) return "Testnet";
  if (passphrase === Networks.PUBLIC) return "Mainnet";
  if (passphrase === Networks.FUTURENET) return "Futurenet";
  return "Custom";
}

// ---------------------------------------------------------------------------
// ScVal argument builders
// ---------------------------------------------------------------------------

function contract(contractId: string): StellarSdk.Contract {
  return new Contract(contractId);
}

/**
 * Converts a Stellar or Soroban address string (G... or C...) to an ScVal
 * address argument for contract calls.
 */
function addressArg(address: string): StellarSdk.xdr.ScVal {
  if (!address || typeof address !== "string") {
    throw new Error(`Invalid address: ${address}`);
  }
  if (address.includes("friendbot") || address.includes("http")) {
    throw new Error(`Invalid address - looks like a URL: ${address}`);
  }
  // Accept both G... (Stellar account) and C... (Soroban contract) addresses
  if (!address.startsWith("G") && !address.startsWith("C")) {
    throw new Error(`Invalid address - must start with G or C: ${address}`);
  }
  return new Address(address).toScVal();
}

/**
 * Encodes a Rust contracttype enum variant without data as an ScVal.
 * Soroban serialises these as ScVec([ScvSymbol("VariantName")]).
 */
function enumArg(variantName: string): StellarSdk.xdr.ScVal {
  return StellarSdk.xdr.ScVal.scvVec([
    StellarSdk.xdr.ScVal.scvSymbol(variantName),
  ]);
}

function numberArg(
  value: bigint | number,
  type: "i128" | "u64" | "i64" | "u32" | "i32",
): StellarSdk.xdr.ScVal {
  return nativeToScVal(value, { type });
}

function symbolArg(value: string): StellarSdk.xdr.ScVal {
  return nativeToScVal(value, { type: "symbol" });
}

// ---------------------------------------------------------------------------
// Data conversion helpers
// ---------------------------------------------------------------------------

/**
 * Sanitises user-supplied description text into a valid Soroban symbol:
 * only alphanumeric and underscores, max 32 chars.
 */
function normalizeDescriptionSymbol(description: string): string {
  const normalized = description
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);

  return normalized || "vault";
}

/**
 * Converts an XLM amount string (e.g. "10.5") to stroops as a bigint.
 * Validates the format strictly — must be positive with up to 7 decimal places.
 *
 * @throws if the format is invalid or negative
 */
function xlmToContractAmount(amount: string | number): bigint {
  const value = String(amount).trim();
  if (!/^\d+(\.\d{1,7})?$/.test(value)) {
    throw new Error(
      "Amount must be a positive XLM value with up to 7 decimal places.",
    );
  }

  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * STROOPS_PER_XLM + BigInt(fraction.padEnd(7, "0"));
}

/**
 * Converts a stroop amount (bigint or numeric) back to a human-readable XLM
 * string, stripping trailing zeros from the fractional part.
 */
function contractAmountToXlm(amount: bigint | number | string): string {
  const raw = typeof amount === "bigint" ? amount : BigInt(amount);
  const whole = raw / STROOPS_PER_XLM;
  const fraction = raw % STROOPS_PER_XLM;
  const fractionText = fraction.toString().padStart(7, "0").replace(/0+$/, "");
  return fractionText ? `${whole}.${fractionText}` : whole.toString();
}

/** Safely converts bigint or nullable values to number. */
function toNumber(value: bigint | number | null | undefined): number {
  return typeof value === "bigint" ? Number(value) : Number(value ?? 0);
}

function mapVaultStatus(status: unknown): Vault["status"] {
  const rawStatus = Array.isArray(status) ? status[0] : status;
  const normalized = String(rawStatus ?? "").toLowerCase();

  const statusMap: Record<string, Vault["status"]> = {
    pending: "pending",
    active: "funded",
    confirmed: "confirmed",
    disputed: "disputed",
    resolved: "resolved",
    cancelled: "cancelled",
    expired: "expired",
  };

  return statusMap[normalized] ?? "pending";
}

function mapDecision(
  decision: unknown,
): ArbitrationCase["decision"] {
  const rawDecision = Array.isArray(decision) ? decision[0] : decision;
  const numericDecision = Number(rawDecision);

  if (numericDecision === 0) return "buyer";
  if (numericDecision === 1) return "seller";
  if (numericDecision === 2) return "split";
  return null;
}

function nativeVaultToUiVault(nativeVault: RawNativeVault | null): Vault | null {
  if (!nativeVault) return null;

  const id = String(nativeVault.id);
  const metadata = readVaultMetadata()[id] ?? {};
  const deadlineSeconds = toNumber(
    nativeVault.deadline as bigint | number | null,
  );
  const deadline =
    deadlineSeconds > 0
      ? new Date(deadlineSeconds * 1000).toISOString()
      : new Date().toISOString();

  return {
    id,
    buyer: String(nativeVault.buyer),
    seller: String(nativeVault.seller),
    arbitrator: String(nativeVault.arbitrator),
    amount: contractAmountToXlm(nativeVault.amount as bigint | number | string),
    description:
      metadata.description || String(nativeVault.description ?? ""),
    status: mapVaultStatus(nativeVault.status),
    createdAt: metadata.createdAt ?? new Date().toISOString(),
    deadline,
    buyerConfirmed: Boolean(nativeVault.buyer_confirmed),
    sellerConfirmed: Boolean(nativeVault.seller_confirmed),
  };
}

function nativeCaseToUiCase(
  nativeCase: RawNativeCase | null,
  vaultId: string | number,
): ArbitrationCase | null {
  if (!nativeCase) return null;

  return {
    vaultId: String((nativeCase.vault_id as string | number | null) ?? vaultId),
    arbitrator: String(nativeCase.arbitrator),
    decision: mapDecision(nativeCase.decision),
    reason: String(nativeCase.reason ?? ""),
    timestamp: new Date(
      toNumber(nativeCase.timestamp as bigint | number | null) * 1000,
    ).toISOString(),
    resolved: true,
  };
}

// ---------------------------------------------------------------------------
// RPC / transaction helpers
// ---------------------------------------------------------------------------

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function assertBrowser(): void {
  if (!isBrowser)
    throw new Error("Wallet operations are only available in the browser.");
}

/** Extracts a human-readable error message from a Freighter error payload. */
function freighterErrorMessage(error: FreighterError): string {
  if (typeof error === "string") return error;
  return error.message ?? JSON.stringify(error);
}

async function getConnectedAddress(): Promise<string> {
  assertBrowser();

  try {
    const connection = await isConnected();
    console.log("Freighter connection status:", connection);
    if (!connection?.isConnected) {
      throw new Error("Freighter wallet is not installed or not connected");
    }

    const access = await requestAccess();
    console.log("Freighter access response:", access);
    if (access.error) {
      throw new Error(freighterErrorMessage(access.error));
    }
    if (access.address) return access.address;

    const currentAddress = await getAddress();
    console.log("Freighter getAddress response:", currentAddress);
    if (currentAddress.error) {
      throw new Error(freighterErrorMessage(currentAddress.error));
    }
    if (!currentAddress.address) throw new Error("No Freighter account selected");

    return currentAddress.address;
  } catch (error) {
    console.error("Wallet connection error details:", error);
    throw error;
  }
}

/**
 * Builds a read-only (simulation-only) Soroban transaction for `readContract`.
 * Uses the well-known all-zeros read-only source account.
 */
function buildReadTransaction(
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[] = [],
): StellarSdk.Transaction {
  const readAccount = new StellarSdk.Account(READONLY_SOURCE_ACCOUNT, "0");
  return new TransactionBuilder(readAccount, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();
}

async function readContract(
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[] = [],
): Promise<unknown> {
  const simulation = await getServer().simulateTransaction(
    buildReadTransaction(contractId, method, args),
  );
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(simulation.error);
  }
  if (!simulation.result?.retval) return null;
  return scValToNative(simulation.result.retval);
}

/** @deprecated Fallback poller — prefer `rpcServer.pollTransaction`. */
async function waitForTransaction(
  server: StellarSdk.rpc.Server,
  hash: string,
): Promise<StellarSdk.rpc.Api.GetTransactionResponse> {
  for (let attempt = 0; attempt < MAX_RPC_POLL_ATTEMPTS; attempt += 1) {
    const result = await server.getTransaction(hash);

    if (result.status === "SUCCESS") return result;
    if (result.status === "FAILED") {
      throw new Error(`Transaction failed: ${hash}`);
    }

    await sleep(RPC_POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting for transaction ${hash}`);
}

// ---------------------------------------------------------------------------
// Public wallet API
// ---------------------------------------------------------------------------

export async function connectWallet(): Promise<string> {
  return getConnectedAddress();
}

export async function getWalletNetworkInfo(): Promise<{
  walletPassphrase: string | null;
  expectedPassphrase: string;
  walletNetwork: string;
  expectedNetwork: string;
  isMatch: boolean;
}> {
  const expectedPassphrase = getNetworkPassphrase();
  let walletPassphrase: string | null = null;

  try {
    if (typeof getNetwork === "function") {
      const network = await getNetwork();
      walletPassphrase =
        network?.networkPassphrase ??
        network?.passphrase ??
        network?.network ??
        null;
    }

    if (!walletPassphrase) {
      const connection = await isConnected();
      walletPassphrase =
        connection?.networkPassphrase ??
        connection?.passphrase ??
        connection?.network ??
        null;
    }
  } catch (error) {
    console.warn("Unable to read wallet network:", error);
  }

  return {
    walletPassphrase,
    expectedPassphrase,
    walletNetwork: networkLabelFromPassphrase(walletPassphrase),
    expectedNetwork: networkLabelFromPassphrase(expectedPassphrase),
    isMatch: Boolean(walletPassphrase) && walletPassphrase === expectedPassphrase,
  };
}

// ---------------------------------------------------------------------------
// Vault contract operations
// ---------------------------------------------------------------------------

export async function createVault(
  buyerAddress: string,
  sellerAddress: string,
  amount: string,
  description: string,
  deadlineDays: number,
  arbitratorAddress: string,
): Promise<string> {
  // Frontend validation to give clear errors instead of VM traps
  if (buyerAddress === sellerAddress) {
    throw new Error("Buyer and seller cannot be the same address.");
  }
  if (arbitratorAddress === buyerAddress) {
    throw new Error("Arbitrator cannot be the same as the buyer.");
  }
  if (arbitratorAddress === sellerAddress) {
    throw new Error("Arbitrator cannot be the same as the seller.");
  }

  const rawAmount = xlmToContractAmount(amount);

  const tx = await submitSponsoredContractCall(
    requireContractId("VITE_ESCROW_CONTRACT_ID"),
    "create_vault",
    [
      addressArg(buyerAddress),
      addressArg(sellerAddress),
      addressArg(arbitratorAddress),
      numberArg(rawAmount, "i128"),
      nativeToScVal(description, { type: "string" }),
      numberArg(BigInt(deadlineDays), "u64"),
    ],
  );

  const vaultId = tx.returnValue ? String(tx.returnValue) : "";
  if (!vaultId)
    throw new Error("Vault was created but no vault ID was returned.");

  rememberVaultMetadata(vaultId, {
    createdAt: new Date().toISOString(),
    description,
  });
  recordTransaction({
    type: "create",
    vaultId,
    from: buyerAddress,
    to: sellerAddress,
    amount,
  });

  return vaultId;
}

export async function depositToVault(
  vaultId: string,
  buyerAddress: string,
  tokenAddress: string,
): Promise<{ txHash: string }> {
  const tx = await submitSponsoredContractCall(
    requireContractId("VITE_ESCROW_CONTRACT_ID"),
    "deposit",
    [
      numberArg(BigInt(vaultId), "u64"),
      addressArg(buyerAddress),
      addressArg(tokenAddress),
    ],
  );

  const vault = await getVault(vaultId);
  recordTransaction({
    type: "deposit",
    vaultId,
    from: buyerAddress,
    to: vault?.seller,
    amount: vault?.amount,
  });

  return { txHash: tx.txHash };
}

export async function confirmVault(
  vaultId: string,
  callerAddress: string,
  tokenAddress: string,
): Promise<{ txHash: string }> {
  const tx = await submitSponsoredContractCall(
    requireContractId("VITE_ESCROW_CONTRACT_ID"),
    "confirm",
    [
      numberArg(BigInt(vaultId), "u64"),
      addressArg(callerAddress),
      addressArg(tokenAddress),
    ],
  );

  const vault = await getVault(vaultId);
  recordTransaction({
    type: "confirm",
    vaultId,
    from: callerAddress,
    to: vault?.seller,
    amount: vault?.amount,
  });

  return { txHash: tx.txHash };
}

export async function flagDispute(
  vaultId: string,
  callerAddress: string,
  reason?: string,
): Promise<{ txHash: string }> {
  const tx = await submitSponsoredContractCall(
    requireContractId("VITE_ESCROW_CONTRACT_ID"),
    "flag_dispute",
    [
      numberArg(BigInt(vaultId), "u64"),
      addressArg(callerAddress),
      nativeToScVal(reason || "No reason provided", { type: "string" }),
    ],
  );

  recordTransaction({
    type: "dispute",
    vaultId,
    from: callerAddress,
  });

  return { txHash: tx.txHash };
}

export async function resolveDispute(
  vaultId: string,
  arbitratorAddress: string,
  decision: string,
  reason: string,
  tokenAddress: string,
): Promise<{ txHash: string }> {
  const decisionKey =
    DECISION_CONTRACT_MAP[decision as DisputeDecision] ?? "SplitFiftyFifty";

  // Contract signature: resolve_dispute(vault_id, arbitrator, decision, reason, token)
  const tx = await submitSponsoredContractCall(
    requireContractId("VITE_ESCROW_CONTRACT_ID"),
    "resolve_dispute",
    [
      numberArg(BigInt(vaultId), "u64"),
      addressArg(arbitratorAddress),
      enumArg(decisionKey),
      nativeToScVal(reason || "Dispute resolved by arbitrator", {
        type: "string",
      }),
      addressArg(tokenAddress || getNativeTokenAddress()),
    ],
  );

  recordTransaction({
    type: "resolve",
    vaultId,
    from: arbitratorAddress,
    decision,
  });

  return { txHash: tx.txHash };
}

// ---------------------------------------------------------------------------
// Vault read operations
// ---------------------------------------------------------------------------

export async function getVault(vaultId: string): Promise<Vault | null> {
  if (!hasEscrowContract()) return null;

  try {
    if (!vaultId || vaultId === "undefined" || vaultId === "null") {
      return null;
    }

    const vaultIdBigInt = BigInt(String(vaultId));
    const nativeVault = await readContract(
      requireContractId("VITE_ESCROW_CONTRACT_ID"),
      "get_vault",
      [numberArg(vaultIdBigInt, "u64")],
    );
    if (!nativeVault) return null;
    return nativeVaultToUiVault(nativeVault as RawNativeVault);
  } catch (error) {
    console.error("Error getting vault:", error);
    return null;
  }
}

export async function getUserVaults(address: string): Promise<Vault[]> {
  if (!address || !hasEscrowContract()) return [];

  try {
    const count = await readContract(
      requireContractId("VITE_ESCROW_CONTRACT_ID"),
      "get_vault_count",
    );
    const vaultIds = Array.from(
      { length: toNumber(count as bigint | number | null) },
      (_, index) => String(index + 1),
    );
    const vaults = await Promise.all(vaultIds.map((id) => getVault(id)));

    return vaults.filter(
      (vault): vault is Vault =>
        vault !== null &&
        (vault.buyer === address || vault.seller === address),
    );
  } catch (error) {
    console.error("Error getting user vaults:", error);
    return [];
  }
}

export async function getAllVaults(): Promise<Vault[]> {
  if (!hasEscrowContract()) return [];

  try {
    const count = await readContract(
      requireContractId("VITE_ESCROW_CONTRACT_ID"),
      "get_vault_count",
    );
    const vaultIds = Array.from(
      { length: toNumber(count as bigint | number | null) },
      (_, index) => String(index + 1),
    );
    const vaults = await Promise.all(vaultIds.map((id) => getVault(id)));

    return vaults.filter((vault): vault is Vault => vault !== null);
  } catch (error) {
    console.error("Error getting all vaults:", error);
    return [];
  }
}

export async function getRecentTransactions(): Promise<Transaction[]> {
  return getTransactions();
}

export async function getArbitrationCase(
  vaultId: string,
): Promise<ArbitrationCase | null> {
  const arbitrationContractId = getOptionalContractId(
    "VITE_ARBITRATION_CONTRACT_ID",
  );
  if (!arbitrationContractId) return null;

  if (!vaultId || vaultId === "undefined" || vaultId === "null") {
    return null;
  }

  try {
    const nativeCase = await readContract(
      arbitrationContractId,
      "get_resolution",
      [numberArg(BigInt(String(vaultId)), "u64")],
    );
    return nativeCaseToUiCase(nativeCase as RawNativeCase | null, vaultId);
  } catch (error) {
    console.error("Error getting arbitration case:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sponsor keypair management
// ---------------------------------------------------------------------------

let SPONSOR_KEYPAIR: StellarSdk.Keypair | null = null;

export function setSponsorKeypair(keypair: StellarSdk.Keypair): void {
  SPONSOR_KEYPAIR = keypair;
}

export function getSponsorKeypair(): StellarSdk.Keypair | null {
  return SPONSOR_KEYPAIR;
}

export async function fundSponsorAccount(): Promise<boolean | null> {
  if (!SPONSOR_KEYPAIR) return null;

  try {
    const sponsorAddress = SPONSOR_KEYPAIR.publicKey();
    const isTestnet = getNetworkPassphrase() === Networks.TESTNET;

    if (!isTestnet) {
      throw new Error("Automatic funding is only available on Testnet.");
    }

    const response = await fetch(
      `https://friendbot.stellar.org?addr=${sponsorAddress}`,
    );

    if (!response.ok) {
      throw new Error("Friendbot request failed.");
    }

    return true;
  } catch (error) {
    console.error("Error funding sponsor account:", error);
    return false;
  }
}

export async function checkSponsorBalance(): Promise<SponsorBalance | null> {
  if (!SPONSOR_KEYPAIR) return null;

  try {
    const sponsorAddress = SPONSOR_KEYPAIR.publicKey();
    const isTestnet = getNetworkPassphrase() === Networks.TESTNET;
    const horizonUrl = isTestnet
      ? "https://horizon-testnet.stellar.org"
      : "https://horizon.stellar.org";

    // Always fetch from Horizon — Soroban RPC getAccount doesn't return balances
    const response = await fetch(`${horizonUrl}/accounts/${sponsorAddress}`);
    if (!response.ok) {
      return {
        address: sponsorAddress,
        balance: 0,
        sufficient: false,
        exists: false,
      };
    }

    const horizonAccount = (await response.json()) as {
      balances?: Array<{ asset_type: string; balance: string }>;
    };
    const balance = horizonAccount.balances?.find(
      (b) => b.asset_type === "native",
    );
    const balanceAmount = balance ? parseFloat(balance.balance) : 0;

    return {
      address: sponsorAddress,
      balance: balanceAmount,
      sufficient: balanceAmount >= 10,
      exists: true,
    };
  } catch (error) {
    console.error("Error checking sponsor balance:", error);
    return {
      address: SPONSOR_KEYPAIR?.publicKey(),
      balance: 0,
      sufficient: false,
      exists: false,
      error: (error as Error).message,
    };
  }
}

// ---------------------------------------------------------------------------
// Core: sponsored contract call
// ---------------------------------------------------------------------------

/**
 * Submits a Soroban contract call via a sponsored fee-bump transaction.
 *
 * Flow:
 *  1. Build inner tx with user as source
 *  2. Simulate to get Soroban resource requirements
 *  3. Assemble (inject auth + resources), then patch the inner fee to BASE_FEE
 *     so Freighter shows ~0 XLM (the fee-bump covers the real cost)
 *  4. Get user signature via Freighter
 *  5. Wrap in fee-bump signed by sponsor keypair
 *  6. Submit and poll until SUCCESS
 *  7. Extract and return the contract return value
 */
export async function submitSponsoredContractCall(
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[] = [],
): Promise<SponsoredCallResult> {
  const sponsorKeypair = getSponsorKeypair();
  const rpcServer = getServer();
  const NETWORK = getNetworkPassphrase();
  const userAddress = await getConnectedAddress();

  if (!userAddress) throw new Error("Wallet not connected");
  if (!sponsorKeypair) throw new Error("Sponsor keypair not configured");

  const userAccount = await rpcServer.getAccount(userAddress);

  // 1. Build the inner transaction with the USER as the source
  const txBuilder = new TransactionBuilder(userAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(contract(contractId).call(method, ...args))
    .setTimeout(30);

  // 2. Simulate to get resource requirements
  const builtTx = txBuilder.build();
  const simulation = await rpcServer.simulateTransaction(builtTx);

  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed: ${JSON.stringify(simulation.error)}`);
  }

  // 3. Assemble with Soroban data (correct auth + resources)
  const assembledTx = rpc.assembleTransaction(builtTx, simulation).build();

  // 4. Patch inner transaction fee to BASE_FEE (100 stroops = 0.00001 XLM).
  //    assembleTransaction hardcodes fee = baseFee + minResourceFee and ignores
  //    baseFee overrides. We patch the XDR directly so Freighter displays ~0 XLM.
  //    The sponsor's fee-bump covers the actual resource cost.
  const xdrEnvelope = assembledTx.toEnvelope();
  xdrEnvelope.v1().tx().fee(100);
  const preparedInnerTx = TransactionBuilder.fromXDR(
    xdrEnvelope.toXDR("base64"),
    NETWORK,
  );

  // 5. Get user's signature via Freighter
  const signedXdr = await signTransaction(preparedInnerTx.toXDR(), {
    networkPassphrase: NETWORK,
  });

  if (signedXdr.error) {
    throw new Error(freighterErrorMessage(signedXdr.error));
  }
  if (!signedXdr.signedTxXdr) {
    throw new Error("Freighter did not return a signed transaction.");
  }

  const signedInnerTx = TransactionBuilder.fromXDR(
    signedXdr.signedTxXdr,
    NETWORK,
  ) as StellarSdk.Transaction;

  // 6. Wrap in fee-bump — sponsor pays actual resource fees
  const resourceFee = parseInt(simulation.minResourceFee ?? "0");
  const totalSponsorFee = resourceFee + parseInt(BASE_FEE) * 2;

  const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
    sponsorKeypair,
    totalSponsorFee.toString(),
    signedInnerTx,
    NETWORK,
  );

  // 7. Sign and submit
  feeBumpTx.sign(sponsorKeypair);
  const response = await rpcServer.sendTransaction(feeBumpTx);

  if (response.status !== "PENDING") {
    throw new Error(`Transaction rejected by RPC: ${JSON.stringify(response)}`);
  }

  // 8. Poll for completion
  const result = await rpcServer.pollTransaction(response.hash, {
    sleepStrategy: StellarSdk.rpc.LinearSleepStrategy,
    attempts: 30,
  });

  if (result.status !== "SUCCESS") {
    throw new Error(`Transaction failed with status: ${result.status}`);
  }

  // 9. Extract return value from Soroban metadata
  let returnValue: unknown = null;
  if (result?.resultMetaXdr) {
    try {
      const meta = (
        result.resultMetaXdr as {
          v4: () => {
            sorobanMeta:
              | (() => { returnValue: (() => unknown) | unknown } | null)
              | { returnValue: (() => unknown) | unknown }
              | null;
          };
        }
      ).v4();
      const sMeta =
        typeof meta.sorobanMeta === "function"
          ? meta.sorobanMeta()
          : meta.sorobanMeta;
      if (sMeta) {
        const rv =
          typeof sMeta.returnValue === "function"
            ? sMeta.returnValue()
            : sMeta.returnValue;
        if (rv) {
          returnValue = scValToNative(rv as StellarSdk.xdr.ScVal);
        }
      }
    } catch (e) {
      console.warn("Could not parse return value:", e);
    }
  }

  return { ...result, returnValue, txHash: response.hash };
}
