#![cfg(test)]
use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, Symbol, symbol_short
};

#[test]
fn test_create_vault() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);

    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);

    client.initialize(&arbitration);

    let vault_id = client.create_vault(
        &buyer,
        &seller,
        &1000i128,
        &symbol_short!("laptop"),
        &7u64,
    );

    assert_eq!(vault_id, 1);

    let vault = client.get_vault(&vault_id);
    assert_eq!(vault.buyer, buyer);
    assert_eq!(vault.seller, seller);
    assert_eq!(vault.amount, 1000);
    assert_eq!(vault.status, VaultStatus::Pending);
}

#[test]
fn test_vault_confirmation_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);

    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);

    client.initialize(&arbitration);

    let vault_id = client.create_vault(
        &buyer,
        &seller,
        &1000i128,
        &symbol_short!("service"),
        &7u64,
    );

    // Simulate deposit
    client.deposit(&vault_id, &buyer);
    let vault = client.get_vault(&vault_id);
    assert_eq!(vault.status, VaultStatus::Active);

    // Buyer confirms
    client.confirm(&vault_id, &buyer);
    let vault = client.get_vault(&vault_id);
    assert!(vault.buyer_confirmed);
    assert!(!vault.seller_confirmed);

    // Seller confirms → auto-release
    client.confirm(&vault_id, &seller);
    let vault = client.get_vault(&vault_id);
    assert_eq!(vault.status, VaultStatus::Confirmed);
}

#[test]
fn test_dispute_flagging() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);

    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);

    client.initialize(&arbitration);

    let vault_id = client.create_vault(
        &buyer,
        &seller,
        &1000i128,
        &symbol_short!("item"),
        &7u64,
    );

    client.deposit(&vault_id, &buyer);
    client.flag_dispute(&vault_id, &buyer);

    let vault = client.get_vault(&vault_id);
    assert_eq!(vault.status, VaultStatus::Disputed);
}

#[test]
fn test_invalid_dispute_on_pending() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);

    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);

    client.initialize(&arbitration);

    let vault_id = client.create_vault(
        &buyer,
        &seller,
        &1000i128,
        &symbol_short!("item"),
        &7u64,
    );

    // Should panic - can't dispute pending vault
    let result = std::panic::catch_unwind(|| {
        client.flag_dispute(&vault_id, &buyer);
    });

    assert!(result.is_err());
}
