import StellarSdk from "@stellar/stellar-sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");

async function setupSponsor() {
  const sponsorKeypair = StellarSdk.Keypair.random();

  console.log("=== Sponsor Account Created ===");
  console.log("Public Key:", sponsorKeypair.publicKey());
  console.log("Secret Key:", sponsorKeypair.secret());
  console.log("\n⚠️  IMPORTANT:");
  console.log("1. Fund this account with XLM from Friendbot:");
  console.log(
    `   https://friendbot.stellar.org?addr=${sponsorKeypair.publicKey()}`,
  );
  console.log("2. Add the secret key to your .env file as VITE_SPONSOR_SECRET");
  console.log("3. Keep this secret key secure! Never commit it to git.");

  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }

  if (!envContent.includes("VITE_SPONSOR_SECRET")) {
    fs.appendFileSync(
      envPath,
      `\nVITE_SPONSOR_SECRET=${sponsorKeypair.secret()}\n`,
    );
    console.log("\n✓ Added sponsor secret to .env file");
  } else {
    console.log("\n⚠️  VITE_SPONSOR_SECRET already exists in .env. Skipping.");
  }
}

setupSponsor().catch(console.error);
