import * as StellarSdk from "@stellar/stellar-sdk";
const { rpc, TransactionBuilder, BASE_FEE, Networks, Account } = StellarSdk;

const server = new rpc.Server("https://soroban-testnet.stellar.org");
const sourceAccount = new Account("GDFGTDYIP5YH2P2HHNTEN6KRI3WSKXDBUQSZWOCUHHJMB7Z3FO2LIUOI", "1");
const contractId = "CCFPVPGDYKSDNQLDYFQLHKLJR4KB36KU2CD3G6N5UOPAXX7BPBMSZ6BN";
const contract = new StellarSdk.Contract(contractId);

const tx = new TransactionBuilder(sourceAccount, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
  .addOperation(contract.call("get_vault_count"))
  .setTimeout(30)
  .build();

console.log("Original tx fee:", tx.fee);

try {
  const sim = await server.simulateTransaction(tx);
  console.log("Simulation minResourceFee:", sim.minResourceFee);
  
  const assembled = rpc.assembleTransaction(tx, sim);
  console.log("assembleTransaction return type:", assembled.constructor.name);
  console.log("Has baseFee?", "baseFee" in assembled);
  console.log("Has build?", typeof assembled.build);
  
  if (assembled.baseFee !== undefined) {
    console.log("baseFee BEFORE override:", assembled.baseFee);
  }
  
  // Try setting baseFee to 100
  assembled.baseFee = "100";
  console.log("baseFee AFTER override:", assembled.baseFee);
  
  if (typeof assembled.build === 'function') {
    const built = assembled.build();
    console.log("Built tx fee (after override to 100):", built.fee);
  }
  
  // Now try without override
  const assembled2 = rpc.assembleTransaction(tx, sim);
  if (typeof assembled2.build === 'function') {
    const built2 = assembled2.build();
    console.log("Built tx fee (NO override):", built2.fee);
  }
} catch(e) {
  console.log("Error:", e.message);
  console.log("Stack:", e.stack);
}
