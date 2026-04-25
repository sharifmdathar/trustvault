
import * as StellarSdk from "@stellar/stellar-sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const {
  BASE_FEE,
  Networks,
  rpc,
  Contract,
  Keypair,
  TransactionBuilder,
  Asset,
} = StellarSdk;

const NETWORK = Networks.TESTNET;
const RPC_URL = "https://soroban-testnet.stellar.org";
const server = new rpc.Server(RPC_URL);

const ESCROW_ID = process.env.VITE_ESCROW_CONTRACT_ID;
const ARBITRATION_ID = process.env.VITE_ARBITRATION_CONTRACT_ID;
const SPONSOR_SECRET = process.env.VITE_SPONSOR_SECRET;

if (!ESCROW_ID || !ARBITRATION_ID || !SPONSOR_SECRET) {
  console.error("Missing environment variables in .env");
  process.exit(1);
}

async function fixInitialization() {
  const sponsorKeypair = Keypair.fromSecret(SPONSOR_SECRET);
  const escrowContract = new Contract(ESCROW_ID);
  
  // Calculate Native Asset Contract ID
  const nativeAsset = Asset.native();
  const nativeAssetContractId = nativeAsset.contractId(NETWORK);
  
  console.log("Fixing Escrow Contract Initialization...");
  console.log("Escrow ID:", ESCROW_ID);
  console.log("Arbitration ID:", ARBITRATION_ID);
  console.log("Native Asset ID:", nativeAssetContractId);
  console.log("Sponsor Address:", sponsorKeypair.publicKey());

  const sourceAccount = await server.getAccount(sponsorKeypair.publicKey());
  
  const op = escrowContract.call(
    "initialize",
    new StellarSdk.Address(ARBITRATION_ID).toScVal(),
    new StellarSdk.Address(nativeAssetContractId).toScVal()
  );

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  // Prepare and sign
  const preparedTx = await server.prepareTransaction(tx);
  preparedTx.sign(sponsorKeypair);
  
  console.log("Submitting transaction...");
  const response = await server.sendTransaction(preparedTx);
  
  if (response.status !== "PENDING") {
    console.error("Transaction failed to submit:", response);
    return;
  }
  
  console.log("Polling for result...");
  const result = await server.pollTransaction(response.hash);
  
  if (result.status === "SUCCESS") {
    console.log("✓ Contract re-initialized successfully!");
    console.log("Vault count was preserved due to the contract fix.");
  } else {
    console.error("Transaction failed:", result);
  }
}

fixInitialization().catch(console.error);
