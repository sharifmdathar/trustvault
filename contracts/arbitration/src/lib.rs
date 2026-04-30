#![no_std]
use soroban_sdk::{Address, Env, String, contract, contractevent, contractimpl, contracttype};

#[derive(Clone, PartialEq, Debug)]
#[contracttype]
pub enum DisputeDecision {
    ReleaseToBuyer,
    ReleaseToSeller,
    SplitFiftyFifty,
}

#[derive(Clone)]
#[contracttype]
pub struct Resolution {
    pub vault_id: u64,
    pub arbitrator: Address,
    pub decision: DisputeDecision,
    pub reason: String,
    pub timestamp: u64,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Resolution(u64),
    ResolutionCount,
    Admin,
}

#[contractevent(topics = ["resolved"])]
#[derive(Clone)]
pub struct DisputeResolvedEvent {
    pub vault_id: u64,
    pub arbitrator: Address,
    pub decision: DisputeDecision,
}

#[contract]
pub struct ArbitrationContract;

#[contractimpl]
impl ArbitrationContract {
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::ResolutionCount, &0u64);
    }

    /// Called by EscrowContract via inter-contract call
    /// Validates and records the arbitrator's decision
    pub fn resolve(
        env: Env,
        vault_id: u64,
        arbitrator: Address,
        expected_arbitrator: Address,
        decision: DisputeDecision,
        reason: String,
    ) -> DisputeDecision {
        arbitrator.require_auth();

        // Validate this is the correct arbitrator for the vault
        if arbitrator != expected_arbitrator {
            panic!("Not the assigned arbitrator for this vault");
        }

        // Record resolution
        let resolution = Resolution {
            vault_id,
            arbitrator: arbitrator.clone(),
            decision: decision.clone(),
            reason,
            timestamp: env.ledger().timestamp(),
        };

        env.storage()
            .instance()
            .set(&DataKey::Resolution(vault_id), &resolution);

        // Update count
        let mut count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::ResolutionCount)
            .unwrap_or(0);
        count += 1;
        env.storage()
            .instance()
            .set(&DataKey::ResolutionCount, &count);

        // Emit event
        DisputeResolvedEvent {
            vault_id,
            arbitrator,
            decision: decision.clone(),
        }
        .publish(&env);

        // Return decision to EscrowContract
        decision
    }

    /// Get resolution details for a vault
    pub fn get_resolution(env: Env, vault_id: u64) -> Option<Resolution> {
        env.storage().instance().get(&DataKey::Resolution(vault_id))
    }

    /// Get total resolutions count
    pub fn get_resolution_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::ResolutionCount)
            .unwrap_or(0)
    }
}

mod test;
