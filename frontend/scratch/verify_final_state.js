
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
  scValToNative,
} = StellarSdk;

const NETWORK = Networks.TESTNET;
const RPC_URL = "https://soroban-testnet.stellar.org";
const server = new rpc.Server(RPC_URL);

const ESCROW_ID = process.env.VITE_ESCROW_CONTRACT_ID;

async function checkState() {
  const contract = new Contract(ESCROW_ID);
  const sourceAccount = new StellarSdk.Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0");
  
  const results = {};
  
  for (const fn of ["get_vault_count", "get_token_contract", "get_arbitration_contract"]) {
    try {
      const op = contract.call(fn);
      const tx = new StellarSdk.TransactionBuilder(sourceAccount, { fee: BASE_FEE, networkPassphrase: NETWORK })
        .addOperation(op)
        .setTimeout(30)
        .build();

      const simulation = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(simulation)) {
        results[fn] = "Error: " + simulation.error;
      } else {
        results[fn] = scValToNative(simulation.result.retval);
      }
    } catch (e) {
      results[fn] = "Error: " + e.message;
    }
  }
  
  console.log("=== Contract State Verification ===");
  console.log(JSON.stringify(results, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
}

checkState().catch(console.error);
