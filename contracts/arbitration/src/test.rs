#![cfg(test)]
use super::*;
use soroban_sdk::{
    testutils::Address as _,
    Address, Env, vec
};

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

    // 2 of 3 vote to release to seller
    client.vote(&1u64, &arb1, &ArbitrationDecision::ReleaseToSeller);
    client.vote(&1u64, &arb2, &ArbitrationDecision::ReleaseToSeller);

    let case = client.get_case(&1u64);
    assert!(case.resolved);
    assert_eq!(case.votes_seller, 2);
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

    // 2 of 3 vote to split
    client.vote(&1u64, &arb1, &ArbitrationDecision::SplitFiftyFifty);
    client.vote(&1u64, &arb2, &ArbitrationDecision::SplitFiftyFifty);

    let case = client.get_case(&1u64);
    assert!(case.resolved);
    assert_eq!(case.votes_split, 2);
}
