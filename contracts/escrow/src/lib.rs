// contracts/escrow/src/lib.rs

#![no_std]
use soroban_sdk::{Address, Env, String, contract, contractevent, contractimpl, contracttype};

// Import ArbitrationContract for inter-contract calls
mod arbitration {
    soroban_sdk::contractimport!(
        file = "../arbitration/target/wasm32v1-none/release/arbitration.wasm"
    );
}

#[derive(Clone, PartialEq, Debug)]
#[contracttype]
pub enum VaultStatus {
    Pending,
    Active,
    Confirmed,
    Disputed,
    Resolved,
    Cancelled,
}

#[derive(Clone, PartialEq, Debug)]
#[contracttype]
pub enum DisputeDecision {
    None,
    ReleaseToBuyer,
    ReleaseToSeller,
    SplitFiftyFifty,
}

#[derive(Clone)]
#[contracttype]
pub struct Vault {
    pub id: u64,
    pub buyer: Address,
    pub seller: Address,
    pub arbitrator: Address,
    pub amount: i128,
    pub description: String,
    pub deadline: u64,
    pub status: VaultStatus,
    pub buyer_confirmed: bool,
    pub seller_confirmed: bool,
    pub dispute_reason: String,
    pub dispute_decision: DisputeDecision,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Vault(u64),
    VaultCount,
    Admin,
    ArbitrationContract,
}

#[contractevent(topics = ["created"])]
#[derive(Clone)]
pub struct VaultCreatedEvent {
    pub vault_id: u64,
    pub buyer: Address,
}

#[contractevent(topics = ["deposit"])]
#[derive(Clone)]
pub struct DepositEvent {
    pub vault_id: u64,
    pub amount: i128,
}

#[contractevent(topics = ["released"])]
#[derive(Clone)]
pub struct ReleasedEvent {
    pub vault_id: u64,
    pub amount: i128,
}

#[contractevent(topics = ["disputed"])]
#[derive(Clone)]
pub struct DisputedEvent {
    pub vault_id: u64,
    pub caller: Address,
}

#[contractevent(topics = ["resolved"])]
#[derive(Clone)]
pub struct VaultResolvedEvent {
    pub vault_id: u64,
    pub arbitrator: Address,
}

#[contractevent(topics = ["cancel"])]
#[derive(Clone)]
pub struct CancelledEvent {
    pub vault_id: u64,
    pub caller: Address,
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    pub fn initialize(env: Env, admin: Address, arbitration_contract: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::ArbitrationContract, &arbitration_contract);
        env.storage().instance().set(&DataKey::VaultCount, &0u64);
    }

    pub fn create_vault(
        env: Env,
        buyer: Address,
        seller: Address,
        arbitrator: Address,
        amount: i128,
        description: String,
        deadline_days: u64,
    ) -> u64 {
        buyer.require_auth();

        if amount <= 0 {
            panic!("Amount must be positive");
        }
        if buyer == seller {
            panic!("Buyer and seller cannot be the same");
        }
        if arbitrator == buyer || arbitrator == seller {
            panic!("Arbitrator cannot be buyer or seller");
        }

        let mut count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::VaultCount)
            .unwrap_or(0);
        count += 1;

        let deadline = env.ledger().timestamp() + (deadline_days * 86400);

        let vault = Vault {
            id: count,
            buyer: buyer.clone(),
            seller: seller.clone(),
            arbitrator,
            amount,
            description,
            deadline,
            status: VaultStatus::Pending,
            buyer_confirmed: false,
            seller_confirmed: false,
            dispute_reason: String::from_str(&env, ""),
            dispute_decision: DisputeDecision::None,
        };

        env.storage().instance().set(&DataKey::Vault(count), &vault);
        env.storage().instance().set(&DataKey::VaultCount, &count);

        VaultCreatedEvent { vault_id: count, buyer }.publish(&env);

        count
    }

    pub fn deposit(env: Env, vault_id: u64, buyer: Address, token: Address) {
        buyer.require_auth();

        let mut vault: Vault = Self::require_vault(env.clone(), vault_id);

        if vault.status != VaultStatus::Pending {
            panic!("Vault not in pending state");
        }
        if vault.buyer != buyer {
            panic!("Only buyer can deposit");
        }

        let token_client = soroban_sdk::token::Client::new(&env, &token);
        token_client.transfer(&buyer, env.current_contract_address(), &vault.amount);

        vault.status = VaultStatus::Active;
        env.storage()
            .instance()
            .set(&DataKey::Vault(vault_id), &vault);

        DepositEvent { vault_id, amount: vault.amount }.publish(&env);
    }

    pub fn confirm(env: Env, vault_id: u64, caller: Address, token: Address) {
        caller.require_auth();

        let mut vault: Vault = Self::require_vault(env.clone(), vault_id);

        if vault.status != VaultStatus::Active {
            panic!("Vault not active");
        }

        if caller == vault.buyer {
            vault.buyer_confirmed = true;
        } else if caller == vault.seller {
            vault.seller_confirmed = true;
        } else {
            panic!("Not a vault participant");
        }

        if vault.buyer_confirmed && vault.seller_confirmed {
            vault.status = VaultStatus::Confirmed;

            let token_client = soroban_sdk::token::Client::new(&env, &token);
            token_client.transfer(
                &env.current_contract_address(),
                &vault.seller,
                &vault.amount,
            );

            ReleasedEvent { vault_id, amount: vault.amount }.publish(&env);
        }

        env.storage()
            .instance()
            .set(&DataKey::Vault(vault_id), &vault);
    }

    pub fn flag_dispute(env: Env, vault_id: u64, caller: Address, reason: String) {
        caller.require_auth();

        let mut vault: Vault = Self::require_vault(env.clone(), vault_id);

        if vault.status != VaultStatus::Active {
            panic!("Can only dispute active vaults");
        }
        if caller != vault.buyer && caller != vault.seller {
            panic!("Not a vault participant");
        }

        vault.status = VaultStatus::Disputed;
        vault.dispute_reason = reason;
        env.storage()
            .instance()
            .set(&DataKey::Vault(vault_id), &vault);

        DisputedEvent { vault_id, caller }.publish(&env);
    }

    /// ⭐ INTER-CONTRACT CALL ⭐
    /// Calls ArbitrationContract to validate and record resolution
    /// Then releases funds based on the decision
    pub fn resolve_dispute(
        env: Env,
        vault_id: u64,
        arbitrator: Address,
        decision: DisputeDecision,
        reason: String,
        token: Address,
    ) {
        arbitrator.require_auth();

        let mut vault: Vault = Self::require_vault(env.clone(), vault_id);

        if vault.status != VaultStatus::Disputed {
            panic!("Vault not in disputed state");
        }

        // ===== INTER-CONTRACT CALL =====
        // Call ArbitrationContract to validate and record resolution
        let arbitration_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::ArbitrationContract)
            .unwrap();
        let arb_client = arbitration::Client::new(&env, &arbitration_addr);

        // Convert to arbitration contract's decision type
        let arb_decision = match &decision {
            DisputeDecision::ReleaseToBuyer => arbitration::DisputeDecision::ReleaseToBuyer,
            DisputeDecision::ReleaseToSeller => arbitration::DisputeDecision::ReleaseToSeller,
            DisputeDecision::SplitFiftyFifty => arbitration::DisputeDecision::SplitFiftyFifty,
            DisputeDecision::None => panic!("Invalid decision"),
        };

        // This call validates the arbitrator and records the resolution
        arb_client.resolve(
            &vault_id,
            &arbitrator,
            &vault.arbitrator, // Pass expected arbitrator for validation
            &arb_decision,
            &reason,
        );
        // ===== END INTER-CONTRACT CALL =====

        // Release funds based on decision
        let token_client = soroban_sdk::token::Client::new(&env, &token);

        match &decision {
            DisputeDecision::ReleaseToBuyer => {
                token_client.transfer(&env.current_contract_address(), &vault.buyer, &vault.amount);
            }
            DisputeDecision::ReleaseToSeller => {
                token_client.transfer(
                    &env.current_contract_address(),
                    &vault.seller,
                    &vault.amount,
                );
            }
            DisputeDecision::SplitFiftyFifty => {
                let half = vault.amount / 2;
                token_client.transfer(&env.current_contract_address(), &vault.buyer, &half);
                token_client.transfer(
                    &env.current_contract_address(),
                    &vault.seller,
                    &(vault.amount - half),
                );
            }
            DisputeDecision::None => panic!("Invalid"),
        }

        vault.status = VaultStatus::Resolved;
        vault.dispute_decision = decision;
        env.storage()
            .instance()
            .set(&DataKey::Vault(vault_id), &vault);

        VaultResolvedEvent { vault_id, arbitrator }.publish(&env);
    }

    pub fn cancel(env: Env, vault_id: u64, caller: Address) {
        caller.require_auth();

        let mut vault: Vault = Self::require_vault(env.clone(), vault_id);

        if vault.status != VaultStatus::Pending {
            panic!("Can only cancel pending vaults");
        }
        if caller != vault.buyer {
            panic!("Only buyer can cancel");
        }

        vault.status = VaultStatus::Cancelled;
        env.storage()
            .instance()
            .set(&DataKey::Vault(vault_id), &vault);

        CancelledEvent { vault_id, caller }.publish(&env);
    }

    pub fn get_vault(env: Env, vault_id: u64) -> Option<Vault> {
        env.storage().instance().get(&DataKey::Vault(vault_id))
    }

    fn require_vault(env: Env, vault_id: u64) -> Vault {
        env.storage()
            .instance()
            .get(&DataKey::Vault(vault_id))
            .expect("Vault not found")
    }

    pub fn get_vault_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::VaultCount)
            .unwrap_or(0)
    }
}

mod test;
