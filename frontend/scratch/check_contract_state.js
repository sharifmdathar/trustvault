
import * as StellarSdk from "@stellar/stellar-sdk";
import * as freighterApiModule from "@stellar/freighter-api";

// Re-use logic from stellar.js but simplified for a script
const {
  BASE_FEE,
  Networks,
  rpc,
  Contract,
  nativeToScVal,
  scValToNative,
} = StellarSdk;

const NETWORK = Networks.TESTNET;
const RPC_URL = "https://soroban-testnet.stellar.org";
const server = new rpc.Server(RPC_URL);

const ESCROW_ID = "CARKHHAAGQI2DOYNMMCOYAYH3MOITIZSNMT46FQVFPMDT2FFRPHRMLDC";

async function checkState() {
  const contract = new Contract(ESCROW_ID);
  
  // Call get_vault_count
  const op = contract.call("get_vault_count");
  const tx = new StellarSdk.TransactionBuilder(
    new StellarSdk.Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"),
    { fee: BASE_FEE, networkPassphrase: NETWORK }
  )
    .addOperation(op)
    .setTimeout(30)
    .build();

  const simulation = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulation)) {
    console.error("Simulation error:", simulation.error);
    return;
  }
  
  const count = scValToNative(simulation.result.retval);
  console.log("Current Vault Count:", count);
}

checkState().catch(console.error);
