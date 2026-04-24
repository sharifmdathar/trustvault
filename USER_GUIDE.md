# 📖 TrustVault User Guide

Welcome to **TrustVault**, the most secure decentralized escrow platform on the Stellar network. This guide will help you navigate the platform, from setting up your wallet to successfully completing secure transactions.

---

## 🛠 Prerequisites

Before you begin, ensure you have:
1.  **Freighter Wallet**: Installed as a browser extension. [Get Freighter](https://www.freighter.app/)
2.  **Stellar Account**: A funded Stellar account (Testnet or Mainnet depending on the environment).
3.  **XLM**: Native Stellar Lumens for transaction deposits (Gas is sponsored!).

---

## 🚀 Getting Started

### 1. Connect Your Wallet
- Open the TrustVault app.
- Click the **Connect Wallet** button in the top right corner.
- Approve the connection request in your Freighter wallet.

### 2. Creating a Vault (Buyer)
If you are the buyer:
- Navigate to **Create Vault**.
- Enter the **Seller's Address**.
- Specify the **Amount** in XLM.
- Provide a brief **Description** of the service/goods.
- Set a **Deadline** (in days) for the contract.
- Click **Launch Vault**. Your transaction fee will be automatically sponsored!

### 3. Funding the Vault
- Once created, find your vault in the **Dashboard**.
- Click **Deposit Funds**.
- Confirm the transaction in Freighter. The XLM will be held securely in the TrustVault smart contract.

---

## 🤝 Completing a Transaction

### 4. Seller's Work
- The Seller sees the vault status change to **Funded**.
- The Seller proceeds with the work/delivery as agreed.

### 5. Confirmation & Release
- Once the work is delivered, the **Seller** clicks **Confirm Completion**.
- The **Buyer** reviews the work and also clicks **Confirm Completion**.
- **Automatic Release**: When both parties have confirmed, the smart contract automatically releases the funds to the Seller's address.

---

## ⚖️ Disputes & Arbitration

If a disagreement occurs:

### 6. Raising a Dispute
- Either the Buyer or the Seller can click **Flag Dispute** on an active vault.
- This freezes the funds and automatically opens an **Arbitration Case**.

### 7. Resolution
- Authorized **Arbitrators** review the evidence provided off-chain.
- Arbitrators cast their votes (Release to Buyer, Release to Seller, or 50/50 Split).
- Once a majority is reached, the funds are distributed according to the decision.

---

## 📊 Monitoring Activity

Visit the **Metrics Dashboard** to see real-time network health, total value locked (TVL), and a live feed of all TrustVault events.

---

## 🔒 Security Tips
- Always double-check the Seller's address before creating a vault.
- Do not confirm completion until you are satisfied with the work.
- Remember that TrustVault never asks for your private keys. All signing happens securely via Freighter.

---

*For technical support or inquiries, please visit our GitHub repository or contact the project administrators.*
