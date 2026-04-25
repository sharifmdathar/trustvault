import * as StellarSdk from "@stellar/stellar-sdk";
const { rpc, TransactionBuilder } = StellarSdk;

console.log("RPC keys:", Object.keys(rpc));

const sourceAccount = new StellarSdk.Account("GDFGTDYIP5YH2P2HHNTEN6KRI3WSKXDBUQSZWOCUHHJMB7Z3FO2LIUOI", "1");
const tx = new TransactionBuilder(sourceAccount, { fee: "100", networkPassphrase: StellarSdk.Networks.TESTNET })
  .addOperation(StellarSdk.Operation.payment({
    destination: "GDFGTDYIP5YH2P2HHNTEN6KRI3WSKXDBUQSZWOCUHHJMB7Z3FO2LIUOI",
    asset: StellarSdk.Asset.native(),
    amount: "1"
  }))
  .setTimeout(30)
  .build();

// Mock a simulation result
const mockSimulation = {
  transactionData: { fee: "500" },
  minResourceFee: "400",
  results: []
};

try {
  const builder = rpc.assembleTransaction(tx, mockSimulation);
  console.log("Builder prototype keys:", Object.keys(Object.getPrototypeOf(builder)));
  console.log("Does builder have setFee?", typeof builder.setFee);
} catch (e) {
  console.log("Error calling assembleTransaction:", e.message);
}
