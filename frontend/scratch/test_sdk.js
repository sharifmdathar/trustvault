import * as StellarSdk from "@stellar/stellar-sdk";
const tx = new StellarSdk.TransactionBuilder(
  new StellarSdk.Account("GDFGTDYIP5YH2P2HHNTEN6KRI3WSKXDBUQSZWOCUHHJMB7Z3FO2LIUOI", "1"),
  { fee: "100", networkPassphrase: StellarSdk.Networks.TESTNET }
).addOperation(StellarSdk.Operation.payment({
  destination: "GDFGTDYIP5YH2P2HHNTEN6KRI3WSKXDBUQSZWOCUHHJMB7Z3FO2LIUOI",
  asset: StellarSdk.Asset.native(),
  amount: "1"
})).setTimeout(30).build();

console.log("Original fee:", tx.fee);
// Try to change it
const tx2 = StellarSdk.TransactionBuilder.fromXDR(tx.toXDR(), StellarSdk.Networks.TESTNET);
console.log("From XDR fee:", tx2.fee);
try {
  tx2.fee = "200";
  console.log("Changed fee:", tx2.fee);
} catch (e) {
  console.log("Could not change fee directly:", e.message);
}
