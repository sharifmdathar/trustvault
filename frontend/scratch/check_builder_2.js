import * as StellarSdk from "@stellar/stellar-sdk";
const sourceAccount = new StellarSdk.Account("GDFGTDYIP5YH2P2HHNTEN6KRI3WSKXDBUQSZWOCUHHJMB7Z3FO2LIUOI", "1");
const builder = new StellarSdk.TransactionBuilder(sourceAccount, { fee: "100", networkPassphrase: StellarSdk.Networks.TESTNET });
console.log("Builder keys:", Object.getOwnPropertyNames(builder));
console.log("Builder proto keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(builder)));
