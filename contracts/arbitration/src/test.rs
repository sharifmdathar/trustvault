// contracts/arbitration/src/test.rs

#![cfg(test)]
use super::*;
use soroban_sdk::{
    testutils::Address as _,
    Address, Env, String
};

#[test]
fn test_resolve_dispute() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(ArbitrationContract, ());
    let client = ArbitrationContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let arbitrator = Address::generate(&env);

    client.initialize(&admin);

    let decision = client.resolve(
        &1u64,
        &arbitrator,
        &arbitrator,
        &DisputeDecision::ReleaseToSeller,
        &String::from_str(&env, "Seller delivered as promised"),
    );

    assert_eq!(decision, DisputeDecision::ReleaseToSeller);

    let resolution = client.get_resolution(&1u64).expect("resolution must exist");
    assert_eq!(resolution.vault_id, 1);
    assert_eq!(resolution.arbitrator, arbitrator);
    assert_eq!(resolution.decision, DisputeDecision::ReleaseToSeller);
}

#[test]
#[should_panic(expected = "Not the assigned arbitrator for this vault")]
fn test_wrong_arbitrator_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(ArbitrationContract, ());
    let client = ArbitrationContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let real_arbitrator = Address::generate(&env);
    let fake_arbitrator = Address::generate(&env);

    client.initialize(&admin);

    // Fake arbitrator tries to resolve — should fail
    client.resolve(
        &1u64,
        &fake_arbitrator,
        &real_arbitrator,
        &DisputeDecision::ReleaseToBuyer,
        &String::from_str(&env, "Trying to steal"),
    );
}

#[test]
fn test_resolution_count() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(ArbitrationContract, ());
    let client = ArbitrationContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let arb1 = Address::generate(&env);
    let arb2 = Address::generate(&env);

    client.initialize(&admin);

    assert_eq!(client.get_resolution_count(), 0);

    client.resolve(
        &1u64, &arb1, &arb1,
        &DisputeDecision::ReleaseToSeller,
        &String::from_str(&env, "Resolved"),
    );

    client.resolve(
        &2u64, &arb2, &arb2,
        &DisputeDecision::SplitFiftyFifty,
        &String::from_str(&env, "Resolved"),
    );

    assert_eq!(client.get_resolution_count(), 2);
}

#[test]
fn test_split_decision() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(ArbitrationContract, ());
    let client = ArbitrationContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let arbitrator = Address::generate(&env);

    client.initialize(&admin);

    let decision = client.resolve(
        &1u64,
        &arbitrator,
        &arbitrator,
        &DisputeDecision::SplitFiftyFifty,
        &String::from_str(&env, "Both parties partially at fault"),
    );

    assert_eq!(decision, DisputeDecision::SplitFiftyFifty);
}