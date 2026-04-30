// contracts/arbitration/src/test.rs

#![cfg(test)]
use super::*;
use soroban_sdk::{Address, Env, String, testutils::Address as _};

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
        &1u64,
        &arb1,
        &arb1,
        &DisputeDecision::ReleaseToSeller,
        &String::from_str(&env, "Resolved"),
    );

    client.resolve(
        &2u64,
        &arb2,
        &arb2,
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

// ─── adversarial / negative tests ────────────────────────────────────────────

#[test]
fn test_release_to_buyer_decision() {
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
        &DisputeDecision::ReleaseToBuyer,
        &String::from_str(&env, "Seller failed to deliver"),
    );
    assert_eq!(decision, DisputeDecision::ReleaseToBuyer);
    let resolution = client.get_resolution(&1u64).expect("resolution must exist");
    assert_eq!(resolution.decision, DisputeDecision::ReleaseToBuyer);
    assert_eq!(resolution.vault_id, 1);
}

#[test]
fn test_get_nonexistent_resolution_returns_none() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(ArbitrationContract, ());
    let client = ArbitrationContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.initialize(&admin);
    assert!(client.get_resolution(&999u64).is_none());
}

#[test]
fn test_double_resolve_same_vault_overwrites_and_increments_count() {
    // Documents the absence of a re-resolution guard: a second call on the same
    // vault_id overwrites the stored resolution and increments the count again.
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(ArbitrationContract, ());
    let client = ArbitrationContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let arbitrator = Address::generate(&env);
    client.initialize(&admin);
    client.resolve(
        &1u64,
        &arbitrator,
        &arbitrator,
        &DisputeDecision::ReleaseToSeller,
        &String::from_str(&env, "First decision"),
    );
    // Second resolve on the same vault — most recent decision wins
    client.resolve(
        &1u64,
        &arbitrator,
        &arbitrator,
        &DisputeDecision::ReleaseToBuyer,
        &String::from_str(&env, "Revised decision"),
    );
    let resolution = client.get_resolution(&1u64).expect("resolution must exist");
    assert_eq!(resolution.decision, DisputeDecision::ReleaseToBuyer);
    // Count is incremented for each call (no idempotency guard)
    assert_eq!(client.get_resolution_count(), 2);
}

#[test]
#[should_panic(expected = "Not the assigned arbitrator for this vault")]
fn test_resolve_with_mismatched_caller_and_expected_rejected() {
    // The caller address is passed as both `arbitrator` and `expected_arbitrator`
    // in normal usage. This test confirms that passing a different caller than
    // the expected arbitrator is rejected even when the vault id is valid.
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(ArbitrationContract, ());
    let client = ArbitrationContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let real_arbitrator = Address::generate(&env);
    let impostor = Address::generate(&env);
    client.initialize(&admin);
    // impostor tries to resolve but the expected arbitrator is real_arbitrator
    client.resolve(
        &1u64,
        &impostor,
        &real_arbitrator,
        &DisputeDecision::ReleaseToBuyer,
        &String::from_str(&env, "Fraudulent resolution"),
    );
}

#[test]
fn test_resolution_timestamp_recorded() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(ArbitrationContract, ());
    let client = ArbitrationContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let arbitrator = Address::generate(&env);
    client.initialize(&admin);
    client.resolve(
        &5u64,
        &arbitrator,
        &arbitrator,
        &DisputeDecision::SplitFiftyFifty,
        &String::from_str(&env, "Split decided"),
    );
    let resolution = client.get_resolution(&5u64).expect("resolution must exist");
    // Timestamp must be a non-negative ledger timestamp
    assert_eq!(resolution.timestamp, env.ledger().timestamp());
}
