import * as StellarSdk from "@stellar/stellar-sdk";
import * as freighterApiModule from "@stellar/freighter-api";

const {
  Address,
  BASE_FEE,
  Contract,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  rpc,
  Horizon,
} = StellarSdk;
export { scValToNative };

// Handle potential default export wrapping
const freighterApi = freighterApiModule.default || freighterApiModule;
const { getAddress, isConnected, requestAccess, signTransaction } =
  freighterApi;

const TRANSACTIONS_KEY = "trustvault:transactions";
const VAULT_METADATA_KEY = "trustvault:vault-metadata";
const READONLY_SOURCE_ACCOUNT =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const STROOPS_PER_XLM = 10_000_000n;
// Native XLM Stellar Asset Contract on Testnet
// Compute with: new StellarSdk.Asset.native().contractId(Networks.TESTNET)
export const NATIVE_XLM_CONTRACT_TESTNET = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
// Will be overridden per-env via helper below
export function getNativeTokenAddress() {
  const fromEnv = typeof import.meta !== "undefined" && import.meta.env?.VITE_NATIVE_TOKEN_ADDRESS;
  return fromEnv || (
    getNetworkPassphrase() === Networks.PUBLIC
      ? StellarSdk.Asset.native().contractId(Networks.PUBLIC)
      : StellarSdk.Asset.native().contractId(Networks.TESTNET)
  );
}
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

export function getServer() {
  return new rpc.Server(getRpcUrl());
}

export function requireContractId(name) {
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

export const horizonServer = new StellarSdk.Horizon.Server(
  getNetworkPassphrase() === Networks.PUBLIC
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org",
);

export const ESCROW_ID = getOptionalContractId("VITE_ESCROW_CONTRACT_ID");

function contract(contractId) {
  return new Contract(contractId);
}

function addressArg(address) {
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

function enumArg(variantName) {
  // Soroban Rust contracttype enums without data are encoded as
  // ScVec([ScvSymbol("VariantName")])
  return StellarSdk.xdr.ScVal.scvVec(
    [StellarSdk.xdr.ScVal.scvSymbol(variantName)]
  );
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
    resolved: "resolved",
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
    arbitrator: String(nativeVault.arbitrator),
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
    arbitrator: String(nativeCase.arbitrator),
    decision: mapDecision(nativeCase.decision),
    reason: String(nativeCase.reason || ""),
    timestamp: new Date(toNumber(nativeCase.timestamp) * 1000).toISOString(),
    resolved: true,
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

  try {
    const connection = await isConnected();
    console.log("Freighter connection status:", connection);
    if (!connection || !connection.isConnected) {
      throw new Error("Freighter wallet is not installed or not connected");
    }

    const access = await requestAccess();
    console.log("Freighter access response:", access);
    if (access.error) {
      const errorMsg = typeof access.error === "string" ? access.error : (access.error.message || JSON.stringify(access.error));
      throw new Error(errorMsg);
    }
    if (access.address) return access.address;

    const currentAddress = await getAddress();
    console.log("Freighter getAddress response:", currentAddress);
    if (currentAddress.error) {
      const errorMsg = typeof currentAddress.error === "string" ? currentAddress.error : (currentAddress.error.message || JSON.stringify(currentAddress.error));
      throw new Error(errorMsg);
    }
    if (!currentAddress.address) throw new Error("No Freighter account selected");

    return currentAddress.address;
  } catch (error) {
    console.error("Wallet connection error details:", error);
    throw error;
  }
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


export async function connectWallet() {
  return getConnectedAddress();
}

export async function createVault(
  buyerAddress,
  sellerAddress,
  amount,
  description,
  deadlineDays,
  arbitratorAddress,
) {
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

  // Use sponsored transaction
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

export async function depositToVault(vaultId, buyerAddress, tokenAddress) {
  await submitSponsoredContractCall(
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

  return true;
}

export async function confirmVault(vaultId, callerAddress, tokenAddress) {
  await submitSponsoredContractCall(
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

  return true;
}

export async function flagDispute(vaultId, callerAddress, reason) {
  await submitSponsoredContractCall(
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

  return true;
}

export async function resolveDispute(
  vaultId,
  arbitratorAddress,
  decision,
  reason,
  tokenAddress,
) {
  // Map decision to contract enum
  const decisionMap = {
    buyer: "ReleaseToBuyer",
    seller: "ReleaseToSeller",
    split: "SplitFiftyFifty",
  };

  const decisionKey = decisionMap[decision] || "SplitFiftyFifty";

  // Contract signature: resolve_dispute(vault_id, arbitrator, decision, reason, token)
  await submitSponsoredContractCall(
    requireContractId("VITE_ESCROW_CONTRACT_ID"),
    "resolve_dispute",
    [
      numberArg(BigInt(vaultId), "u64"),
      addressArg(arbitratorAddress),
      enumArg(decisionKey),
      nativeToScVal(reason || "Dispute resolved by arbitrator", { type: "string" }),
      addressArg(tokenAddress || getNativeTokenAddress()),
    ],
  );

  recordTransaction({
    type: "resolve",
    vaultId,
    from: arbitratorAddress,
    decision,
  });

  return true;
}

export async function getVault(vaultId) {
  if (!hasEscrowContract()) return null;

  try {
    // Handle potentially invalid vaultId from route params
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

export async function getAllVaults() {
  if (!hasEscrowContract()) return [];

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

    return vaults.filter(Boolean);
  } catch (error) {
    console.error("Error getting all vaults:", error);
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

  if (!vaultId || vaultId === "undefined" || vaultId === "null") {
    return null;
  }

  try {
    const nativeCase = await readContract(arbitrationContractId, "get_resolution", [
      numberArg(BigInt(String(vaultId)), "u64"),
    ]);
    return nativeCaseToUiCase(nativeCase, vaultId);
  } catch (error) {
    console.error("Error getting arbitration case:", error);
    return null;
  }
}

// Sponsored transaction helpers
let SPONSOR_KEYPAIR = null;

export function setSponsorKeypair(keypair) {
  SPONSOR_KEYPAIR = keypair;
}

export function getSponsorKeypair() {
  return SPONSOR_KEYPAIR;
}

export async function fundSponsorAccount() {
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

export async function checkSponsorBalance() {
  if (!SPONSOR_KEYPAIR) return null;

  try {
    const sponsorAddress = SPONSOR_KEYPAIR.publicKey();
    const isTestnet = getNetworkPassphrase() === Networks.TESTNET;
    const horizonUrl = isTestnet
      ? "https://horizon-testnet.stellar.org"
      : "https://horizon.stellar.org";

    // Always fetch from Horizon for balances, as Soroban RPC getAccount doesn't return them
    const response = await fetch(`${horizonUrl}/accounts/${sponsorAddress}`);
    if (!response.ok) {
      return {
        address: sponsorAddress,
        balance: 0,
        sufficient: false,
        exists: false,
      };
    }

    const horizonAccount = await response.json();
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
      error: error.message,
    };
  }
}

export async function submitSponsoredContractCall(
  contractId,
  method,
  args = [],
) {
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

  // 3. Assemble the transaction with Soroban data (correct auth + resources)
  const assembledTx = rpc.assembleTransaction(builtTx, simulation).build();

  // 4. FORCE the inner transaction fee to BASE_FEE (100 stroops = 0.00001 XLM)
  // The SDK's assembleTransaction hardcodes fee = baseFee + minResourceFee and
  // ignores baseFee overrides. We must directly patch the XDR fee field so that
  // Freighter displays ~0 XLM. The sponsor's fee-bump covers the real cost.
  const xdrEnvelope = assembledTx.toEnvelope();
  xdrEnvelope.v1().tx().fee(100); // 100 stroops = 0.00001 XLM
  const preparedInnerTx = TransactionBuilder.fromXDR(
    xdrEnvelope.toXDR("base64"),
    NETWORK,
  );

  // 5. Get user's signature via Freighter (will now show ~0 XLM fee)
  const signedXdr = await signTransaction(preparedInnerTx.toXDR(), {
    networkPassphrase: NETWORK,
  });

  if (signedXdr.error) {
    const errorMsg =
      typeof signedXdr.error === "string"
        ? signedXdr.error
        : signedXdr.error.message || JSON.stringify(signedXdr.error);
    throw new Error(errorMsg);
  }
  if (!signedXdr.signedTxXdr) {
    throw new Error("Freighter did not return a signed transaction.");
  }

  const signedInnerTx = TransactionBuilder.fromXDR(
    signedXdr.signedTxXdr,
    NETWORK,
  );

  // 6. Wrap in Fee-Bump
  const resourceFee = parseInt(simulation.minResourceFee || "0");
  const totalSponsorFee = resourceFee + BASE_FEE * 2;

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

  // 9. Extract return value
  let returnValue = null;
  if (result && result.resultMetaXdr) {
    try {
      const meta = result.resultMetaXdr.v4();
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
          returnValue = scValToNative(rv);
        }
      }
    } catch (e) {
      console.warn("Could not parse return value:", e);
    }
  }

  return { ...result, returnValue };
}
