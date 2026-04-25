import * as StellarSdk from "@stellar/stellar-sdk";
const { rpc, TransactionBuilder, BASE_FEE, Networks, Account, Transaction, xdr } = StellarSdk;

const server = new rpc.Server("https://soroban-testnet.stellar.org");
const sourceAccount = new Account("GDFGTDYIP5YH2P2HHNTEN6KRI3WSKXDBUQSZWOCUHHJMB7Z3FO2LIUOI", "1");
const contractId = "CCFPVPGDYKSDNQLDYFQLHKLJR4KB36KU2CD3G6N5UOPAXX7BPBMSZ6BN";
const contract = new StellarSdk.Contract(contractId);

const tx = new TransactionBuilder(sourceAccount, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
  .addOperation(contract.call("get_vault_count"))
  .setTimeout(30)
  .build();

try {
  const sim = await server.simulateTransaction(tx);
  console.log("minResourceFee:", sim.minResourceFee);
  
  const assembled = rpc.assembleTransaction(tx, sim).build();
  console.log("Assembled fee:", assembled.fee);
  
  // Directly modify fee in the XDR envelope
  const xdrEnvelope = assembled.toEnvelope();
  const txBody = xdrEnvelope.v1().tx();
  txBody.fee(100); // Set to 100 stroops
  
  // Rebuild Transaction from modified XDR
  const lowFeeTx = TransactionBuilder.fromXDR(xdrEnvelope.toXDR("base64"), Networks.TESTNET);
  console.log("Low-fee tx fee:", lowFeeTx.fee);
  console.log("Low-fee tx source:", lowFeeTx.source);
  console.log("Low-fee tx hash differs?", lowFeeTx.hash().toString('hex') !== assembled.hash().toString('hex'));
  
} catch(e) {
  console.log("Error:", e.message);
  console.log("Stack:", e.stack);
}
