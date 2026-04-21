// test.rs
#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, vec, Address, Env};

#[test]
fn test_arbitration_majority_vote() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, ArbitrationContract);
    let client = ArbitrationContractClient::new(&env, &contract_id);

    let escrow = Address::generate(&env);
    let arb1 = Address::generate(&env);
    let arb2 = Address::generate(&env);
    let arb3 = Address::generate(&env);
    let caller = Address::generate(&env);

    let arbitrators = vec![&env, arb1.clone(), arb2.clone(), arb3.clone()];
    client.initialize(&escrow, &arbitrators);

    client.open_case(&1u64, &caller);

    // 2 of 3 vote to release to seller (1 = RELEASE_TO_SELLER)
    client.vote(&1u64, &arb1, &1u32);
    client.vote(&1u64, &arb2, &1u32);

    let case = client.get_case(&1u64);
    assert!(case.resolved);
    assert_eq!(case.votes_seller, 2);
    assert_eq!(case.decision, ArbitrationDecision::RELEASE_TO_SELLER);
}

#[test]
fn test_split_decision() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, ArbitrationContract);
    let client = ArbitrationContractClient::new(&env, &contract_id);

    let escrow = Address::generate(&env);
    let arb1 = Address::generate(&env);
    let arb2 = Address::generate(&env);
    let arb3 = Address::generate(&env);
    let caller = Address::generate(&env);

    let arbitrators = vec![&env, arb1.clone(), arb2.clone(), arb3.clone()];
    client.initialize(&escrow, &arbitrators);

    client.open_case(&1u64, &caller);

    // 2 of 3 vote to split (2 = SPLIT_FIFTY_FIFTY)
    client.vote(&1u64, &arb1, &2u32);
    client.vote(&1u64, &arb2, &2u32);

    let case = client.get_case(&1u64);
    assert!(case.resolved);
    assert_eq!(case.votes_split, 2);
    assert_eq!(case.decision, ArbitrationDecision::SPLIT_FIFTY_FIFTY);
}

#[test]
fn test_buyer_decision() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, ArbitrationContract);
    let client = ArbitrationContractClient::new(&env, &contract_id);

    let escrow = Address::generate(&env);
    let arb1 = Address::generate(&env);
    let arb2 = Address::generate(&env);
    let arb3 = Address::generate(&env);
    let caller = Address::generate(&env);

    let arbitrators = vec![&env, arb1.clone(), arb2.clone(), arb3.clone()];
    client.initialize(&escrow, &arbitrators);

    client.open_case(&1u64, &caller);

    // 2 of 3 vote to release to buyer (0 = RELEASE_TO_BUYER)
    client.vote(&1u64, &arb1, &0u32);
    client.vote(&1u64, &arb2, &0u32);

    let case = client.get_case(&1u64);
    assert!(case.resolved);
    assert_eq!(case.votes_buyer, 2);
    assert_eq!(case.decision, ArbitrationDecision::RELEASE_TO_BUYER);
}