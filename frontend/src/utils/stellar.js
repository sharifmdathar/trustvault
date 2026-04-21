import StellarSdk from "@stellar/stellar-sdk";
import freighterApi from "@stellar/freighter-api";

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
const { getAddress, isConnected, requestAccess, signTransaction } =
  freighterApi;

const TRANSACTIONS_KEY = "trustvault:transactions";
const VAULT_METADATA_KEY = "trustvault:vault-metadata";
const READONLY_SOURCE_ACCOUNT =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const STROOPS_PER_XLM = 10_000_000n;
const MAX_RPC_POLL_ATTEMPTS = 30;
const RPC_POLL_INTERVAL_MS = 1_000;
const ENV = {
  VITE_ARBITRATION_CONTRACT_ID: import.meta.env.VITE_ARBITRATION_CONTRACT_ID,
  VITE_ESCROW_CONTRACT_ID: import.meta.env.VITE_ESCROW_CONTRACT_ID,
  VITE_NETWORK: import.meta.env.VITE_NETWORK,
  VITE_NETWORK_PASSPHRASE: import.meta.env.VITE_NETWORK_PASSPHRASE,
  VITE_SOROBAN_URL: import.meta.env.VITE_SOROBAN_URL,
};

const isBrowser = typeof window !== "undefined";

function readJson(key, fallback) {
  if (!isBrowser) return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return fallback;
  }
}

function writeJson(key, value) {
  if (!isBrowser) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
  }
}

function getTransactions() {
  return readJson(TRANSACTIONS_KEY, []);
}

function saveTransactions(transactions) {
  writeJson(TRANSACTIONS_KEY, transactions);
}

function recordTransaction(transaction) {
  saveTransactions([
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
      status: "success",
      ...transaction,
    },
    ...getTransactions(),
  ]);
}

function readVaultMetadata() {
  return readJson(VAULT_METADATA_KEY, {});
}

function writeVaultMetadata(metadata) {
  writeJson(VAULT_METADATA_KEY, metadata);
}

function rememberVaultMetadata(vaultId, metadata) {
  const currentMetadata = readVaultMetadata();
  writeVaultMetadata({
    ...currentMetadata,
    [String(vaultId)]: {
      ...currentMetadata[String(vaultId)],
      ...metadata,
    },
  });
}

function getEnv(name) {
  return ENV[name];
}

function isPlaceholder(value) {
  return !value || value.startsWith("your_") || value.includes("<");
}

function getNetworkPassphrase() {
  const configuredPassphrase = getEnv("VITE_NETWORK_PASSPHRASE");
  if (configuredPassphrase) return configuredPassphrase;

  const configuredNetwork = (getEnv("VITE_NETWORK") || "testnet").toLowerCase();
  if (configuredNetwork === "public" || configuredNetwork === "mainnet")
    return Networks.PUBLIC;
  if (configuredNetwork === "futurenet") return Networks.FUTURENET;
  return Networks.TESTNET;
}

function getRpcUrl() {
  return getEnv("VITE_SOROBAN_URL") || "https://soroban-testnet.stellar.org";
}

function getServer() {
  return new rpc.Server(getRpcUrl());
}

function requireContractId(name) {
  const value = getEnv(name);
  if (isPlaceholder(value)) {
    throw new Error(
      `Missing ${name}. Set it in .env before interacting with TrustVault contracts.`,
    );
  }
  return value;
}

function getOptionalContractId(name) {
  const value = getEnv(name);
  return isPlaceholder(value) ? null : value;
}

function hasEscrowContract() {
  return Boolean(getOptionalContractId("VITE_ESCROW_CONTRACT_ID"));
}

function contract(contractId) {
  return new Contract(contractId);
}

function addressArg(address) {
  return new Address(address).toScVal();
}

function numberArg(value, type) {
  return nativeToScVal(value, { type });
}

function symbolArg(value) {
  return nativeToScVal(value, { type: "symbol" });
}

function normalizeDescriptionSymbol(description) {
  const normalized = description
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);

  return normalized || "vault";
}

function xlmToContractAmount(amount) {
  const value = String(amount).trim();
  if (!/^\d+(\.\d{1,7})?$/.test(value)) {
    throw new Error(
      "Amount must be a positive XLM value with up to 7 decimal places.",
    );
  }

  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * STROOPS_PER_XLM + BigInt(fraction.padEnd(7, "0"));
}

function contractAmountToXlm(amount) {
  const raw = typeof amount === "bigint" ? amount : BigInt(amount);
  const whole = raw / STROOPS_PER_XLM;
  const fraction = raw % STROOPS_PER_XLM;
  const fractionText = fraction.toString().padStart(7, "0").replace(/0+$/, "");
  return fractionText ? `${whole}.${fractionText}` : whole.toString();
}

function toNumber(value) {
  return typeof value === "bigint" ? Number(value) : Number(value ?? 0);
}

function mapVaultStatus(status) {
  const rawStatus = Array.isArray(status) ? status[0] : status;
  const normalized = String(rawStatus || "").toLowerCase();

  const statusMap = {
    pending: "pending",
    active: "funded",
    confirmed: "confirmed",
    disputed: "disputed",
    cancelled: "cancelled",
    expired: "expired",
  };

  return statusMap[normalized] || "pending";
}

function mapDecision(decision) {
  const rawDecision = Array.isArray(decision) ? decision[0] : decision;
  const numericDecision =
    typeof rawDecision === "bigint" ? Number(rawDecision) : Number(rawDecision);

  if (numericDecision === 0) return "buyer";
  if (numericDecision === 1) return "seller";
  if (numericDecision === 2) return "split";
  return null;
}

function nativeVaultToUiVault(nativeVault) {
  if (!nativeVault) return null;

  const id = String(nativeVault.id);
  const metadata = readVaultMetadata()[id] || {};
  const deadlineSeconds = toNumber(nativeVault.deadline);
  const deadline =
    deadlineSeconds > 0
      ? new Date(deadlineSeconds * 1000).toISOString()
      : new Date().toISOString();

  return {
    id,
    buyer: String(nativeVault.buyer),
    seller: String(nativeVault.seller),
    amount: contractAmountToXlm(nativeVault.amount),
    description: metadata.description || String(nativeVault.description || ""),
    status: mapVaultStatus(nativeVault.status),
    createdAt: metadata.createdAt || new Date().toISOString(),
    deadline,
    buyerConfirmed: Boolean(nativeVault.buyer_confirmed),
    sellerConfirmed: Boolean(nativeVault.seller_confirmed),
  };
}

function nativeCaseToUiCase(nativeCase, vaultId) {
  if (!nativeCase) return null;

  return {
    vaultId: String(nativeCase.vault_id ?? vaultId),
    arbitrators: (nativeCase.arbitrators || []).map(String),
    votesBuyer: toNumber(nativeCase.votes_buyer),
    votesSeller: toNumber(nativeCase.votes_seller),
    votesSplit: toNumber(nativeCase.votes_split),
    totalVotes: toNumber(nativeCase.total_votes),
    resolved: Boolean(nativeCase.resolved),
    decision: mapDecision(nativeCase.decision),
  };
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function assertBrowser() {
  if (!isBrowser)
    throw new Error("Wallet operations are only available in the browser.");
}

async function getConnectedAddress() {
  assertBrowser();

  const connection = await isConnected();
  if (!connection.isConnected) {
    throw new Error("Freighter wallet is not installed or not connected");
  }

  const access = await requestAccess();
  if (access.error) throw new Error(access.error.message);
  if (access.address) return access.address;

  const currentAddress = await getAddress();
  if (currentAddress.error) throw new Error(currentAddress.error.message);
  if (!currentAddress.address) throw new Error("No Freighter account selected");

  return currentAddress.address;
}

function buildReadTransaction(contractId, method, args = []) {
  const readAccount = new StellarSdk.Account(READONLY_SOURCE_ACCOUNT, "0");
  return new TransactionBuilder(readAccount, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();
}

async function readContract(contractId, method, args = []) {
  const simulation = await getServer().simulateTransaction(
    buildReadTransaction(contractId, method, args),
  );
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(simulation.error);
  }
  if (!simulation.result?.retval) return null;
  return scValToNative(simulation.result.retval);
}

async function waitForTransaction(server, hash) {
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

async function submitContractCall(
  sourceAddress,
  contractId,
  method,
  args = [],
) {
  assertBrowser();

  const server = getServer();
  const networkPassphrase = getNetworkPassphrase();
  const sourceAccount = await server.getAccount(sourceAddress);
  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();

  const preparedTransaction = await server.prepareTransaction(transaction);
  const signed = await signTransaction(preparedTransaction.toXDR(), {
    address: sourceAddress,
    networkPassphrase,
  });

  if (signed.error) throw new Error(signed.error.message);
  if (!signed.signedTxXdr)
    throw new Error("Freighter did not return a signed transaction.");

  const signedTransaction = TransactionBuilder.fromXDR(
    signed.signedTxXdr,
    networkPassphrase,
  );
  const submitted = await server.sendTransaction(signedTransaction);

  if (submitted.status === "ERROR") {
    throw new Error(`Transaction rejected by RPC: ${submitted.hash}`);
  }
  if (submitted.status === "TRY_AGAIN_LATER") {
    throw new Error("RPC is busy. Please try again later.");
  }

  return waitForTransaction(server, submitted.hash);
}

export async function connectWallet() {
  return getConnectedAddress();
}

export async function createVault(
  buyerAddress,
  sellerAddress,
  amount,
  description,
  deadlineDays,
) {
  const normalizedDescription = normalizeDescriptionSymbol(description);
  const rawAmount = xlmToContractAmount(amount);
  const tx = await submitContractCall(
    buyerAddress,
    requireContractId("VITE_ESCROW_CONTRACT_ID"),
    "create_vault",
    [
      addressArg(buyerAddress),
      addressArg(sellerAddress),
      numberArg(rawAmount, "i128"),
      symbolArg(normalizedDescription),
      numberArg(BigInt(deadlineDays), "u64"),
    ],
  );

  const vaultId = tx.returnValue
    ? scValToNative(tx.returnValue).toString()
    : "";
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

export async function depositToVault(vaultId, buyerAddress) {
  await submitContractCall(
    buyerAddress,
    requireContractId("VITE_ESCROW_CONTRACT_ID"),
    "deposit",
    [numberArg(BigInt(vaultId), "u64"), addressArg(buyerAddress)],
  );

  const vault = await getVault(vaultId);
  recordTransaction({
    type: "deposit",
    vaultId,
    from: buyerAddress,
    to: vault?.seller,
    amount: vault?.amount,
  });

  return true;
}

export async function confirmVault(vaultId, callerAddress) {
  await submitContractCall(
    callerAddress,
    requireContractId("VITE_ESCROW_CONTRACT_ID"),
    "confirm",
    [numberArg(BigInt(vaultId), "u64"), addressArg(callerAddress)],
  );

  const vault = await getVault(vaultId);
  recordTransaction({
    type: "confirm",
    vaultId,
    from: callerAddress,
    to: vault?.seller,
    amount: vault?.amount,
  });

  return true;
}

export async function flagDispute(vaultId, callerAddress) {
  await submitContractCall(
    callerAddress,
    requireContractId("VITE_ESCROW_CONTRACT_ID"),
    "flag_dispute",
    [numberArg(BigInt(vaultId), "u64"), addressArg(callerAddress)],
  );

  const arbitrationContractId = getOptionalContractId(
    "VITE_ARBITRATION_CONTRACT_ID",
  );
  if (arbitrationContractId) {
    await submitContractCall(
      callerAddress,
      arbitrationContractId,
      "open_case",
      [numberArg(BigInt(vaultId), "u64"), addressArg(callerAddress)],
    );
  }

  recordTransaction({
    type: "dispute",
    vaultId,
    from: callerAddress,
  });

  return true;
}

export async function getVault(vaultId) {
  if (!hasEscrowContract()) return null;

  try {
    const nativeVault = await readContract(
      requireContractId("VITE_ESCROW_CONTRACT_ID"),
      "get_vault",
      [numberArg(BigInt(vaultId), "u64")],
    );
    return nativeVaultToUiVault(nativeVault);
  } catch (error) {
    console.error("Error getting vault:", error);
    return null;
  }
}

export async function getUserVaults(address) {
  if (!address || !hasEscrowContract()) return [];

  try {
    const count = await readContract(
      requireContractId("VITE_ESCROW_CONTRACT_ID"),
      "get_vault_count",
    );
    const vaultIds = Array.from({ length: toNumber(count) }, (_, index) =>
      String(index + 1),
    );
    const vaults = await Promise.all(
      vaultIds.map((vaultId) => getVault(vaultId)),
    );

    return vaults.filter(
      (vault) => vault && (vault.buyer === address || vault.seller === address),
    );
  } catch (error) {
    console.error("Error getting user vaults:", error);
    return [];
  }
}

export async function getRecentTransactions() {
  return getTransactions();
}

export async function getArbitrationCase(vaultId) {
  const arbitrationContractId = getOptionalContractId(
    "VITE_ARBITRATION_CONTRACT_ID",
  );
  if (!arbitrationContractId) return null;

  try {
    const nativeCase = await readContract(arbitrationContractId, "get_case", [
      numberArg(BigInt(vaultId), "u64"),
    ]);
    return nativeCaseToUiCase(nativeCase, vaultId);
  } catch (error) {
    console.error("Error getting arbitration case:", error);
    return null;
  }
}
