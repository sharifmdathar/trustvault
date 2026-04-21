#![cfg(test)]
use super::*;
use soroban_sdk::{symbol_short, testutils::Address as _, token::StellarAssetClient, Address, Env};

#[test]
fn test_create_vault() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);

    // Create and initialize a mock token
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let token_client = StellarAssetClient::new(&env, &token_address);

    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);

    // Fund the buyer with tokens
    token_client.mint(&buyer, &1000i128);

    client.initialize(&arbitration, &token_address);

    let vault_id = client.create_vault(&buyer, &seller, &1000i128, &symbol_short!("laptop"), &7u64);

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

    // Create and initialize a mock token
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let token_client = StellarAssetClient::new(&env, &token_address);

    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);

    // Fund the buyer with tokens
    token_client.mint(&buyer, &1000i128);

    client.initialize(&arbitration, &token_address);

    let vault_id =
        client.create_vault(&buyer, &seller, &1000i128, &symbol_short!("service"), &7u64);

    // Simulate deposit - now the token transfer will work
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

    // Create and initialize a mock token
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let token_client = StellarAssetClient::new(&env, &token_address);

    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);

    // Fund the buyer with tokens
    token_client.mint(&buyer, &1000i128);

    client.initialize(&arbitration, &token_address);

    let vault_id = client.create_vault(&buyer, &seller, &1000i128, &symbol_short!("item"), &7u64);

    client.deposit(&vault_id, &buyer);
    client.flag_dispute(&vault_id, &buyer);

    let vault = client.get_vault(&vault_id);
    assert_eq!(vault.status, VaultStatus::Disputed);
}

#[test]
#[should_panic(expected = "Can only dispute active vaults")]
fn test_invalid_dispute_on_pending() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);

    // Create and initialize a mock token
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let token_client = StellarAssetClient::new(&env, &token_address);

    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);

    // Fund the buyer with tokens
    token_client.mint(&buyer, &1000i128);

    client.initialize(&arbitration, &token_address);

    let vault_id = client.create_vault(&buyer, &seller, &1000i128, &symbol_short!("item"), &7u64);

    // This should panic because vault is still Pending
    client.flag_dispute(&vault_id, &buyer);
}
