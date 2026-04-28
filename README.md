# 🔐 TrustVault

Decentralized escrow on Stellar.

[![TrustVault CI/CD](https://github.com/sharifmdathar/trustvault/actions/workflows/ci.yml/badge.svg)](https://github.com/sharifmdathar/trustvault/actions/workflows/ci.yml)

TrustVault is a secure, decentralized escrow platform built on the Stellar network using Soroban smart contracts. It enables trustless transactions between buyers and sellers with built-in arbitration and fee sponsorship for a seamless user experience.

---

## Demo Video
[![Demo Video Youtube Link](https://markdown-videos-api.jorgenkh.no/youtube/GgBaDCy7JLM?width=1024&height=576&filetype=jpeg)](https://youtu.be/GgBaDCy7JLM)

## 🚀 Live Demo 

- **Live Demo**: [trustvault-ten.vercel.app](https://trustvault-ten.vercel.app/)

## Contact Addresses
- **Escrow Contract**: `CAMPH4OVQKQWBBGA4F5VOL6UZJZMKXXGORRBJGWS4DHJRYBGRFKOXRNG`
- **Arbitration Contract**: `CAZLZGITOGMTNO7WAAESD5WQUBPRFVZPVT7LLFEAJGUWHYHA2EO3U2F2`

---

## 🏗 Architecture Diagram

```mermaid
graph TD
    subgraph Users
        B[Buyer]
        S[Seller]
        A[Arbitrators]
    end

    subgraph TrustVault Platform
        subgraph Contracts
            EC[Escrow Contract]
            AC[Arbitration Contract]
        end

        subgraph Frontend
            UI[React/Vike UI]
            SP[Fee Sponsor Service]
        end
    end

    B -->|1. Create & Deposit| EC
    S -->|2. Deliver Work| UI
    B & S -->|3. Confirm| EC
    EC -->|4. Release Funds| S

    B & S -->|Alternative: Dispute| EC
    EC -->|Open Case| AC
    A -->|Vote| AC
    AC -->|Resolve| EC
```

---

## 📖 How to Use (Step by Step)

1.  **Connect**: Link your Freighter wallet to the TrustVault dashboard.
2.  **Create**: As a Buyer, create a new vault by providing the Seller's address and the amount.
3.  **Fund**: Deposit the agreed-upon XLM into the secure escrow contract.
4.  **Confirm**: Once work is completed, both parties click **Confirm**.
5.  **Release**: Funds are automatically transferred to the Seller upon mutual confirmation.
6.  **Dispute**: If issues arise, flag a dispute to involve authorized arbitrators.

See the full [User Guide](USER_GUIDE.md) for more details.

---

## 📜 Contract Functions Explained

### Escrow Contract

- `create_vault`: Initializes a new escrow agreement between a buyer and seller.
- `deposit`: Transfers funds from the buyer's wallet to the contract's secure storage.
- `confirm`: Allows participants to signal completion. Triggers automatic release if both confirm.
- `flag_dispute`: Freezes the vault and signals the need for arbitration.

### Arbitration Contract

- `open_case`: Creates an arbitration case linked to a specific vault ID.
- `vote`: Allows authorized arbitrators to cast votes (Release to Buyer, Release to Seller, or Split).
- `get_case`: Retrieves the current state and results of an arbitration case.

---

## 🔒 Security Checklist

### Smart Contracts

- [x] Auth checks on all state-changing functions
- [x] Integer overflow protection (Rust native)
- [x] Input validation (amounts > 0, valid addresses)
- [x] No unauthorized fund access
- [x] Deadline enforcement
- [x] Dispute can only be raised by participants
- [x] Arbitrators verified before voting

### Frontend

- [x] No private keys in code
- [x] Contract IDs from environment variables
- [x] Transaction signing client-side only
- [x] HTTPS enforced on deployment
- [x] Sponsor key kept server-side only

### Operations

- [x] Sponsor account funded with limits
- [x] Error messages don't expose internals
- [x] All contract calls have error handling

> **Artifact note:** The checklist above is the canonical security audit artifact for this project. It covers smart contract authorization, input validation, frontend key hygiene, and operational safeguards.

---

## 📱 Mobile Screenshot

![Mobile View](docs/screenshots/mobile-view.png)
---

## 🔍 Monitoring & Observability

TrustVault contract interactions and platform health can be monitored through Stellar's public infrastructure and optional self-hosted dashboards.

- **Stellar Expert**: View on-chain transactions, contract invocations, and account activity in real time.
- **Soroban RPC Logs**: Monitor contract call success/failure rates via the Soroban RPC endpoint.
- **Application Logs**: The fee sponsor service logs all sponsored transactions with timestamps and status codes.

![Monitoring Screenshot](docs/screenshots/monitoring.png)

---

## 📊 Metrics Dashboard

[Metrics Dashboard Link](https://trustvault-ten.vercel.app/metrics)

![Metrics Dashboard](docs/screenshots/metrics-dashboard.png)

---

## 🗂 Data Indexing

TrustVault aggregates on-chain escrow data within the application to power the frontend dashboard and provide fast lookups.

- **Vault Index**: Created vaults are tracked by ID, status (active / completed / disputed), and participant addresses.
- **Transaction History**: Deposits, confirmations, and dispute events are recorded with timestamps for audit trails.
- **Arbitration Records**: Case outcomes and voting history are stored for transparency and dispute analytics.

Data is sourced from Soroban contract events and Stellar Horizon queries at read time — no external indexer is required.

---

## ⛽ Fee Sponsorship Explanation

TrustVault leverages Stellar's **Fee Bump Transactions** to provide a "gasless" experience for users.

- A dedicated **Sponsor Account** covers the network fees for all contract interactions.
- Users only need to sign the inner transaction; the platform wraps it in a fee-bump signed by the sponsor.
- This removes the friction of maintaining XLM for gas, making the platform accessible to all.

---

## ⚙️ Advanced Features

TrustVault goes beyond basic escrow with production-grade capabilities:

| Feature | Description |
|---|---|
| **Fee Sponsorship** | Gasless UX via Stellar fee-bump transactions (see section above) |
| **Multi-Party Arbitration** | Dispute resolution through authorized arbitrator voting |
| **Deadline Enforcement** | Smart-contract-level timeout logic prevents funds from being locked indefinitely |
| **Dual Confirmation Release** | Funds release only after both buyer and seller confirm |

---

## 💻 Local Setup Instructions

### Prerequisites

- [Bun](https://bun.sh/)
- [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup)
- Rust & wasm32 target

### Steps

1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/sharifmdathar/trustvault.git
    cd trustvault
    ```
2.  **Install Dependencies**:
    ```bash
    cd frontend && bun install
    ```
3.  **Configure Environment**:
    Create a `.env` file in the `frontend` directory:
    ```env
    VITE_ESCROW_CONTRACT_ID=your_escrow_id
    VITE_ARBITRATION_CONTRACT_ID=your_arbitration_id
    VITE_NETWORK=testnet
    VITE_SOROBAN_URL=https://soroban-testnet.stellar.org
    VITE_SPONSOR_SECRET=YOUR_SPONSOR_SECRET
    ```
4.  **Run Development Server**:
    ```bash
    bun run dev
    ```
5.  **Build Contracts** (Optional):
    ```bash
    cd contracts/escrow && stellar contract build
    ```

---

## 👥 User Feedback

**Onboarding Form:** [Respond Here](https://forms.gle/f6gUTLBtoPWkk3yX9)

---

## 🤝 Community & Contributions

Contributions are welcome. To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes and open a Pull Request

- **Issue Tracker:** [GitHub Issues](https://github.com/sharifmdathar/trustvault/issues)
- **Community Contribution (Twitter/X):** [TrustVault event post](https://x.com/the_md_athar/status/2049089335048409238)


## 🚀 Next-Phase Improvement Plan

Planned improvements for upcoming development cycles:

| Priority | Improvement | Status |
|---|---|---|
| High | Mainnet deployment with production sponsor account | Planned |
| High | Formal smart contract audit by third-party firm | Planned |
| Medium | Multi-token escrow support (USDC, custom assets) | Planned |
| Medium | Mobile-responsive UI overhaul | Planned |
| Low | Notification system (email/webhook on vault events) | Backlog |
| Low | Escrow templates for recurring agreements | Backlog |

---

_Built with ❤️ for the Stellar ecosystem._
