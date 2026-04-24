import StellarSdk from "@stellar/stellar-sdk";

const { BASE_FEE, Keypair, Networks, TransactionBuilder } = StellarSdk;

const { VITE_SPONSOR_SECRET, VITE_SOROBAN_URL } = import.meta.env;

const SPONSOR_KEYPAIR = VITE_SPONSOR_SECRET
  ? Keypair.fromSecret(VITE_SPONSOR_SECRET)
  : null;

function getSponsorKeypair() {
  if (!SPONSOR_KEYPAIR) {
    throw new Error(
      "Missing VITE_SPONSOR_SECRET. Fund the sponsor account and set VITE_SPONSOR_SECRET in .env.",
    );
  }
  return SPONSOR_KEYPAIR;
}

export async function submitWithFeeBump(userSignedTransaction, server) {
  const sponsorKeypair = getSponsorKeypair();

  const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
    sponsorKeypair,
    BASE_FEE * 10,
    userSignedTransaction,
    Networks.TESTNET,
  );

  feeBumpTx.sign(sponsorKeypair);

  return server.submitTransaction(feeBumpTx);
}

export async function createAndSubmitFeeBump(transactionXdr, server) {
  const transaction = TransactionBuilder.fromXDR(
    transactionXdr,
    Networks.TESTNET,
  );

  return submitWithFeeBump(transaction, server);
}
