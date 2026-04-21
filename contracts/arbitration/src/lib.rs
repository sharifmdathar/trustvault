#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Vec};

#[derive(Clone, PartialEq)]
#[contracttype]
pub enum ArbitrationDecision {
    ReleaseToBuyer,
    ReleaseToSeller,
    SplitFiftyFifty,
}

#[derive(Clone)]
#[contracttype]
pub struct ArbitrationCase {
    pub vault_id: u64,
    pub arbitrators: Vec<Address>,
    pub votes_buyer: u32,
    pub votes_seller: u32,
    pub votes_split: u32,
    pub total_votes: u32,
    pub resolved: bool,
    pub decision: Option<ArbitrationDecision>,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Case(u64),
    Arbitrators,
    EscrowContract,
}

#[contract]
pub struct ArbitrationContract;

#[contractimpl]
impl ArbitrationContract {
    pub fn initialize(env: Env, escrow_contract: Address, arbitrators: Vec<Address>) {
        env.storage()
            .instance()
            .set(&DataKey::EscrowContract, &escrow_contract);
        env.storage()
            .instance()
            .set(&DataKey::Arbitrators, &arbitrators);
    }

    pub fn open_case(env: Env, vault_id: u64, caller: Address) {
        caller.require_auth();

        let arbitrators: Vec<Address> =
            env.storage().instance().get(&DataKey::Arbitrators).unwrap();

        let case = ArbitrationCase {
            vault_id,
            arbitrators,
            votes_buyer: 0,
            votes_seller: 0,
            votes_split: 0,
            total_votes: 0,
            resolved: false,
            decision: None,
        };

        env.storage()
            .instance()
            .set(&DataKey::Case(vault_id), &case);

        env.events()
            .publish((symbol_short!("case"), caller), vault_id);
    }

    pub fn vote(env: Env, vault_id: u64, arbitrator: Address, decision: ArbitrationDecision) {
        arbitrator.require_auth();

        let mut case: ArbitrationCase = env
            .storage()
            .instance()
            .get(&DataKey::Case(vault_id))
            .expect("Case not found");

        if case.resolved {
            panic!("Case already resolved");
        }

        // Verify arbitrator is authorized
        if !case.arbitrators.contains(&arbitrator) {
            panic!("Not an authorized arbitrator");
        }

        // Record vote
        match decision {
            ArbitrationDecision::ReleaseToBuyer => case.votes_buyer += 1,
            ArbitrationDecision::ReleaseToSeller => case.votes_seller += 1,
            ArbitrationDecision::SplitFiftyFifty => case.votes_split += 1,
        }
        case.total_votes += 1;

        // Check if majority reached (2 of 3)
        let majority = case.arbitrators.len() / 2 + 1;

        if case.votes_buyer >= majority as u32 {
            case.resolved = true;
            case.decision = Some(ArbitrationDecision::ReleaseToBuyer);
        } else if case.votes_seller >= majority as u32 {
            case.resolved = true;
            case.decision = Some(ArbitrationDecision::ReleaseToSeller);
        } else if case.votes_split >= majority as u32 {
            case.resolved = true;
            case.decision = Some(ArbitrationDecision::SplitFiftyFifty);
        }

        env.storage()
            .instance()
            .set(&DataKey::Case(vault_id), &case);

        if case.resolved {
            env.events().publish(
                (symbol_short!("resolved"), arbitrator),
                (vault_id, case.total_votes),
            );
        }
    }

    pub fn get_case(env: Env, vault_id: u64) -> ArbitrationCase {
        env.storage()
            .instance()
            .get(&DataKey::Case(vault_id))
            .expect("Case not found")
    }
}

mod test;
