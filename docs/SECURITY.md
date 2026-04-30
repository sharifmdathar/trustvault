# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Testnet (current) | Yes |
| Mainnet (planned) | Will be supported on launch |

Security reports are accepted for the current testnet deployment and all code on the `main` branch.

## Scope

The following components are in scope for security reports:

| Component | Location | Language |
|---|---|---|
| Escrow Contract | `contracts/escrow/` | Rust (Soroban) |
| Arbitration Contract | `contracts/arbitration/` | Rust (Soroban) |
| Frontend Application | `frontend/` | TypeScript, React, Vike |
| Fee Sponsor Service | `frontend/src/utils/` | TypeScript |

Deployed contract addresses:

- **Escrow**: `CAMPH4OVQKQWBBGA4F5VOL6UZJZMKXXGORRBJGWS4DHJRYBGRFKOXRNG`
- **Arbitration**: `CAZLZGITOGMTNO7WAAESD5WQUBPRFVZPVT7LLFEAJGUWHYHA2EO3U2F2`

## Threat Model

TrustVault holds user funds in smart contract escrow and routes disputes through an arbitration contract. The threat model is organized by attack surface.

### Smart Contract Risks

| Threat | Impact | Mitigation |
|---|---|---|
| Unauthorized fund withdrawal | Critical — direct loss of escrowed funds | `require_auth()` on every state-changing function; only buyer can deposit, only participants can confirm |
| Arbitrator impersonation | High — attacker resolves disputes in their favor | Arbitrator address validated against the vault's assigned arbitrator in both escrow and arbitration contracts |
| State manipulation (e.g., skipping `Active` to `Confirmed`) | High — premature fund release | Explicit status checks enforce the vault lifecycle: Pending → Active → Confirmed/Disputed → Resolved |
| Integer overflow in fund splits | Medium — incorrect payout during 50/50 split | Rust's native overflow protection; `amount / 2` and `amount - half` pattern handles odd amounts |
| Vault creation with zero or negative amount | Medium — invalid escrow state | Input validation rejects `amount <= 0` at `create_vault` entry point |
| Deadline bypass | Medium — funds locked indefinitely or released early | Deadline computed from ledger timestamp at creation; enforcement is on-chain |

### Inter-Contract Call Risks

| Threat | Impact | Mitigation |
|---|---|---|
| Spoofed call to `ArbitrationContract.resolve` | High — fake resolution recorded | Arbitration contract re-validates arbitrator auth and checks `expected_arbitrator` matches |
| Reentrancy during fund transfer | Medium — double payout | Soroban's execution model prevents reentrancy; state is written before token transfer in `resolve_dispute` |

### Frontend & Wallet Risks

| Threat | Impact | Mitigation |
|---|---|---|
| Sponsor secret key exposure | Critical — attacker drains sponsor account | Key stored server-side only (`VITE_SPONSOR_SECRET` in `.env`, never in client bundle) |
| Transaction tampering before signing | High — user signs a different transaction than displayed | All transaction construction happens client-side; Freighter displays transaction details for user review |
| Contract ID substitution | High — user interacts with a malicious contract | Contract IDs loaded from environment variables, not hardcoded or user-supplied |
| XSS leading to wallet interaction | Medium — phishing or unauthorized transaction prompts | React's default escaping; no `dangerouslySetInnerHTML` usage |
| Wrong network connection | Low — transactions fail or hit unintended network | Network validation in wallet connection flow |

### Operational Risks

| Threat | Impact | Mitigation |
|---|---|---|
| Sponsor account depletion | Medium — fee sponsorship stops, UX degrades | Sponsor account funded with limits; monitoring via application logs |
| Leaked environment variables | High — contract IDs or sponsor key compromised | `.env` excluded from version control; secrets not logged in error messages |

## Security Controls

Existing controls implemented in the codebase:

- **Authorization**: Every state-changing contract function calls `require_auth()` on the acting party.
- **Input validation**: `create_vault` rejects zero/negative amounts and identical buyer/seller/arbitrator addresses.
- **State machine enforcement**: Vault status transitions are explicitly guarded (e.g., deposits only on `Pending`, disputes only on `Active`).
- **Client-side signing**: Private keys never leave the user's Freighter wallet. The platform never has access to user keys.
- **Fee-bump isolation**: The sponsor key signs only the outer fee-bump transaction, not the inner user transaction.
- **No hardcoded secrets**: Contract IDs and the sponsor key are sourced from environment variables.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

### Contact

<!-- ⚠️ MAINTAINER: Replace this placeholder with your preferred security contact -->

| Channel | Address |
|---|---|
| Email | **security@trustvault.example** *(placeholder — update with real contact)* |
| GitHub Private Advisory | [Open a draft advisory](https://github.com/sharifmdathar/trustvault/security/advisories/new) |

### What to Include

1. **Affected component** — which contract, frontend module, or service.
2. **Description** — what the vulnerability is and how it can be exploited.
3. **Reproduction steps** — minimal steps or a proof-of-concept.
4. **Impact assessment** — what an attacker gains (fund theft, data leak, denial of service, etc.).
5. **Suggested fix** (optional) — if you have a remediation in mind.

### Encryption

If you need to share sensitive details, request a PGP key by emailing the security contact above with the subject line `PGP Key Request`.

## Response Timeline

| Stage | Target SLA |
|---|---|
| Acknowledgment of report | 48 hours |
| Initial triage and severity assessment | 5 business days |
| Status update to reporter | Every 7 days until resolved |
| Fix deployed (Critical/High) | 14 days |
| Fix deployed (Medium/Low) | 30 days |
| Public disclosure | 90 days after report, or upon fix — whichever comes first |

Timelines may be extended for complex smart contract issues that require redeployment and fund migration.

## Disclosure Policy

TrustVault follows **coordinated disclosure**:

1. The reporter submits the vulnerability privately using the channels above.
2. The maintainers confirm, triage, and develop a fix.
3. The reporter is credited (unless they prefer anonymity) when the fix is published.
4. A public advisory is issued after the fix is deployed, within the 90-day disclosure window.

Reporters may request an extension if they believe more time is needed. We will not request extensions beyond 90 days without mutual agreement.

## Out of Scope

The following are **not** eligible for security reports:

- Vulnerabilities in third-party dependencies (Stellar SDK, Soroban runtime, Freighter wallet) — report these to their respective maintainers.
- Issues that require physical access to a user's device.
- Social engineering attacks against users or maintainers.
- Denial-of-service against the Stellar network itself.
- Bugs in testnet-only test fixtures (`contracts/*/src/test.rs`).
- Missing security headers on the Vercel-hosted frontend (report via a regular issue instead).
- Clickjacking or UI redressing that does not lead to unauthorized transactions.
- Rate limiting or brute force on public blockchain queries.

## Safe Harbor

We consider security research conducted in accordance with this policy to be:

- **Authorized** under applicable anti-hacking laws.
- **Exempt** from DMCA restrictions on circumventing security controls for the purpose of research.
- **Lawful, helpful, and in the interest of the project's users.**

We will not pursue legal action against researchers who:

- Act in good faith and follow this disclosure process.
- Avoid accessing or modifying other users' data or funds.
- Do not degrade the platform's availability (no denial-of-service testing against production).
- Report findings promptly and do not publicly disclose before the agreed timeline.

If a third party initiates legal action against you for research conducted under this policy, we will make it known that your actions were authorized.

---

*This policy applies to the TrustVault repository at [github.com/sharifmdathar/trustvault](https://github.com/sharifmdathar/trustvault). Last updated: April 2026.*
