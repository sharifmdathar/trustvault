
import * as StellarSdk from "@stellar/stellar-sdk";
import StellarSdkDefault from "@stellar/stellar-sdk";
import * as freighterApi from "@stellar/freighter-api";
import freighterApiDefault from "@stellar/freighter-api";

console.log("StellarSdk named keys:", Object.keys(StellarSdk));
console.log("StellarSdk default keys:", StellarSdkDefault ? Object.keys(StellarSdkDefault) : "null");

console.log("freighterApi named keys:", Object.keys(freighterApi));
console.log("freighterApi default keys:", freighterApiDefault ? Object.keys(freighterApiDefault) : "null");
