# Contributing to TrustVault

Thanks for your interest in improving TrustVault. This guide covers everything you need to get started.

## Prerequisites

- [Bun](https://bun.sh/) (frontend runtime and package manager)
- [Rust](https://rustup.rs/) with the `wasm32v1-none` target
- [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup) (for contract builds and deployment)
- A [Freighter](https://www.freighter.app/) wallet configured for Stellar Testnet

## Local Setup

```bash
git clone https://github.com/sharifmdathar/trustvault.git
cd trustvault
cd frontend && bun install
```

Copy the example environment file and fill in your values:

```bash
cp frontend/.env.example frontend/.env
```

Start the dev server:

```bash
cd frontend && bun run dev
```

Build contracts (requires Rust + Stellar CLI):

```bash
cd contracts/escrow && stellar contract build
cd ../arbitration && stellar contract build
```

Run contract tests:

```bash
cd contracts/escrow && cargo test
cd ../arbitration && cargo test
```

## Branch and PR Workflow

1. Fork the repository and clone your fork.
2. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature
   ```
3. Make your changes in small, focused commits.
4. Push to your fork and open a Pull Request against `main`.
5. CI runs automatically on every PR — both contract builds/tests and frontend build must pass.

## Project Structure

```
trustvault/
├── contracts/
│   ├── escrow/        # Soroban escrow smart contract (Rust)
│   └── arbitration/   # Soroban arbitration smart contract (Rust)
├── frontend/          # React + Vike frontend (TypeScript/JSX)
│   ├── components/    # Reusable UI components
│   ├── pages/         # Route-based pages
│   └── src/utils/     # Stellar SDK helpers, fee bump logic
└── docs/              # Screenshots and supplementary docs
```

## Coding Standards

**Smart Contracts (Rust)**

- All state-changing functions must include authorization checks.
- Validate inputs at the entry point (positive amounts, valid addresses).
- Write tests for every public function — see `contracts/escrow/src/test.rs` for examples.
- Run `cargo test` before committing.

**Frontend (TypeScript / React)**

- Use functional components with hooks.
- Keep contract IDs and network config in environment variables, never hardcoded.
- No private keys or secrets in client-side code.
- Run `bun run build` to confirm the frontend compiles cleanly.

## Reporting Issues

Open an issue on [GitHub Issues](https://github.com/sharifmdathar/trustvault/issues) with:

- A clear title describing the problem or feature request.
- Steps to reproduce (for bugs).
- Expected vs. actual behavior.
- Browser, wallet, and network details if relevant.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
