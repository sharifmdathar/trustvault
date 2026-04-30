#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, token::StellarAssetClient, Address, Env, String};

#[test]
fn test_create_vault() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowContract, ());
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

    let vault_id = client.create_vault(&buyer, &seller, &arbitration, &1000i128, &String::from_str(&env, "laptop"), &7u64);

    assert_eq!(vault_id, 1);

    let vault = client.get_vault(&vault_id).expect("vault should exist");
    assert_eq!(vault.buyer, buyer);
    assert_eq!(vault.seller, seller);
    assert_eq!(vault.amount, 1000);
    assert_eq!(vault.status, VaultStatus::Pending);
}

#[test]
fn test_vault_confirmation_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowContract, ());
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
        client.create_vault(&buyer, &seller, &arbitration, &1000i128, &String::from_str(&env, "service"), &7u64);

    // Simulate deposit - now the token transfer will work
    client.deposit(&vault_id, &buyer, &token_address);
    let vault = client.get_vault(&vault_id).expect("vault should exist");
    assert_eq!(vault.status, VaultStatus::Active);

    // Buyer confirms
    client.confirm(&vault_id, &buyer, &token_address);
    let vault = client.get_vault(&vault_id).expect("vault should exist");
    assert!(vault.buyer_confirmed);
    assert!(!vault.seller_confirmed);

    // Seller confirms → auto-release
    client.confirm(&vault_id, &seller, &token_address);
    let vault = client.get_vault(&vault_id).expect("vault should exist");
    assert_eq!(vault.status, VaultStatus::Confirmed);
}

#[test]
fn test_dispute_flagging() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowContract, ());
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

    let vault_id = client.create_vault(&buyer, &seller, &arbitration, &1000i128, &String::from_str(&env, "item"), &7u64);

    client.deposit(&vault_id, &buyer, &token_address);
    client.flag_dispute(&vault_id, &buyer, &String::from_str(&env, "reason"));

    let vault = client.get_vault(&vault_id).expect("vault should exist");
    assert_eq!(vault.status, VaultStatus::Disputed);
}

// ─── create_vault input validation ───────────────────────────────────────────

#[test]
#[should_panic(expected = "Amount must be positive")]
fn test_create_vault_zero_amount_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    client.initialize(&arbitration, &token_address);
    client.create_vault(&buyer, &seller, &arbitration, &0i128, &String::from_str(&env, "item"), &7u64);
}

#[test]
#[should_panic(expected = "Amount must be positive")]
fn test_create_vault_negative_amount_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    client.initialize(&arbitration, &token_address);
    client.create_vault(&buyer, &seller, &arbitration, &-500i128, &String::from_str(&env, "item"), &7u64);
}

#[test]
#[should_panic(expected = "Buyer and seller cannot be the same")]
fn test_create_vault_buyer_equals_seller_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let arbitration = Address::generate(&env);
    let same_party = Address::generate(&env);
    client.initialize(&arbitration, &token_address);
    client.create_vault(&same_party, &same_party, &arbitration, &1000i128, &String::from_str(&env, "item"), &7u64);
}

#[test]
#[should_panic(expected = "Arbitrator cannot be buyer or seller")]
fn test_create_vault_arbitrator_is_buyer_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    client.initialize(&arbitration, &token_address);
    // Buyer doubles as arbitrator
    client.create_vault(&buyer, &seller, &buyer, &1000i128, &String::from_str(&env, "item"), &7u64);
}

#[test]
#[should_panic(expected = "Arbitrator cannot be buyer or seller")]
fn test_create_vault_arbitrator_is_seller_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    client.initialize(&arbitration, &token_address);
    // Seller doubles as arbitrator
    client.create_vault(&buyer, &seller, &seller, &1000i128, &String::from_str(&env, "item"), &7u64);
}

// ─── deposit access control ───────────────────────────────────────────────────

#[test]
#[should_panic(expected = "Only buyer can deposit")]
fn test_deposit_by_non_buyer_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let token_client = StellarAssetClient::new(&env, &token_address);
    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let stranger = Address::generate(&env);
    token_client.mint(&stranger, &1000i128);
    client.initialize(&arbitration, &token_address);
    let vault_id = client.create_vault(&buyer, &seller, &arbitration, &1000i128, &String::from_str(&env, "item"), &7u64);
    // Stranger is not the vault's buyer
    client.deposit(&vault_id, &stranger, &token_address);
}

#[test]
#[should_panic(expected = "Vault not in pending state")]
fn test_double_deposit_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let token_client = StellarAssetClient::new(&env, &token_address);
    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    token_client.mint(&buyer, &2000i128);
    client.initialize(&arbitration, &token_address);
    let vault_id = client.create_vault(&buyer, &seller, &arbitration, &1000i128, &String::from_str(&env, "item"), &7u64);
    client.deposit(&vault_id, &buyer, &token_address);
    // Vault is now Active — second deposit must be rejected
    client.deposit(&vault_id, &buyer, &token_address);
}

// ─── confirm access control and state checks ─────────────────────────────────

#[test]
#[should_panic(expected = "Vault not active")]
fn test_confirm_on_pending_vault_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    client.initialize(&arbitration, &token_address);
    let vault_id = client.create_vault(&buyer, &seller, &arbitration, &1000i128, &String::from_str(&env, "item"), &7u64);
    // No deposit yet — vault is Pending, confirm must be rejected
    client.confirm(&vault_id, &buyer, &token_address);
}

#[test]
#[should_panic(expected = "Not a vault participant")]
fn test_confirm_by_outsider_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let token_client = StellarAssetClient::new(&env, &token_address);
    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let stranger = Address::generate(&env);
    token_client.mint(&buyer, &1000i128);
    client.initialize(&arbitration, &token_address);
    let vault_id = client.create_vault(&buyer, &seller, &arbitration, &1000i128, &String::from_str(&env, "item"), &7u64);
    client.deposit(&vault_id, &buyer, &token_address);
    // Stranger is neither buyer nor seller
    client.confirm(&vault_id, &stranger, &token_address);
}

#[test]
#[should_panic(expected = "Vault not active")]
fn test_confirm_on_disputed_vault_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let token_client = StellarAssetClient::new(&env, &token_address);
    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    token_client.mint(&buyer, &1000i128);
    client.initialize(&arbitration, &token_address);
    let vault_id = client.create_vault(&buyer, &seller, &arbitration, &1000i128, &String::from_str(&env, "item"), &7u64);
    client.deposit(&vault_id, &buyer, &token_address);
    client.flag_dispute(&vault_id, &buyer, &String::from_str(&env, "issue"));
    // Vault is Disputed — confirm must be rejected
    client.confirm(&vault_id, &seller, &token_address);
}

// ─── dispute access control and state checks ─────────────────────────────────

#[test]
#[should_panic(expected = "Not a vault participant")]
fn test_dispute_by_outsider_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let token_client = StellarAssetClient::new(&env, &token_address);
    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let stranger = Address::generate(&env);
    token_client.mint(&buyer, &1000i128);
    client.initialize(&arbitration, &token_address);
    let vault_id = client.create_vault(&buyer, &seller, &arbitration, &1000i128, &String::from_str(&env, "item"), &7u64);
    client.deposit(&vault_id, &buyer, &token_address);
    client.flag_dispute(&vault_id, &stranger, &String::from_str(&env, "fraud"));
}

#[test]
#[should_panic(expected = "Can only dispute active vaults")]
fn test_double_dispute_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let token_client = StellarAssetClient::new(&env, &token_address);
    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    token_client.mint(&buyer, &1000i128);
    client.initialize(&arbitration, &token_address);
    let vault_id = client.create_vault(&buyer, &seller, &arbitration, &1000i128, &String::from_str(&env, "item"), &7u64);
    client.deposit(&vault_id, &buyer, &token_address);
    client.flag_dispute(&vault_id, &buyer, &String::from_str(&env, "first"));
    // Already Disputed — second flag must be rejected
    client.flag_dispute(&vault_id, &seller, &String::from_str(&env, "counter"));
}

#[test]
#[should_panic(expected = "Can only dispute active vaults")]
fn test_dispute_after_settlement_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let token_client = StellarAssetClient::new(&env, &token_address);
    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    token_client.mint(&buyer, &1000i128);
    client.initialize(&arbitration, &token_address);
    let vault_id = client.create_vault(&buyer, &seller, &arbitration, &1000i128, &String::from_str(&env, "item"), &7u64);
    client.deposit(&vault_id, &buyer, &token_address);
    client.confirm(&vault_id, &buyer, &token_address);
    client.confirm(&vault_id, &seller, &token_address);
    // Vault is now Confirmed — dispute after settlement must be rejected
    client.flag_dispute(&vault_id, &buyer, &String::from_str(&env, "too late"));
}

// ─── cancel access control and state checks ──────────────────────────────────

#[test]
#[should_panic(expected = "Only buyer can cancel")]
fn test_cancel_by_non_buyer_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    client.initialize(&arbitration, &token_address);
    let vault_id = client.create_vault(&buyer, &seller, &arbitration, &1000i128, &String::from_str(&env, "item"), &7u64);
    // Seller cannot cancel a pending vault
    client.cancel(&vault_id, &seller);
}

#[test]
#[should_panic(expected = "Can only cancel pending vaults")]
fn test_cancel_active_vault_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let token_client = StellarAssetClient::new(&env, &token_address);
    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    token_client.mint(&buyer, &1000i128);
    client.initialize(&arbitration, &token_address);
    let vault_id = client.create_vault(&buyer, &seller, &arbitration, &1000i128, &String::from_str(&env, "item"), &7u64);
    client.deposit(&vault_id, &buyer, &token_address);
    // Vault is Active — cancel must be rejected
    client.cancel(&vault_id, &buyer);
}

#[test]
#[should_panic(expected = "Can only cancel pending vaults")]
fn test_cancel_disputed_vault_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let token_client = StellarAssetClient::new(&env, &token_address);
    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    token_client.mint(&buyer, &1000i128);
    client.initialize(&arbitration, &token_address);
    let vault_id = client.create_vault(&buyer, &seller, &arbitration, &1000i128, &String::from_str(&env, "item"), &7u64);
    client.deposit(&vault_id, &buyer, &token_address);
    client.flag_dispute(&vault_id, &buyer, &String::from_str(&env, "fraud"));
    // Vault is Disputed — cancel must be rejected
    client.cancel(&vault_id, &buyer);
}

// ─── vault not found ──────────────────────────────────────────────────────────

#[test]
fn test_get_nonexistent_vault_returns_none() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let arbitration = Address::generate(&env);
    client.initialize(&arbitration, &token_address);
    assert!(client.get_vault(&999u64).is_none());
}

// ─── double-confirm idempotency (no double-release) ──────────────────────────

#[test]
fn test_buyer_double_confirm_no_double_release() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_address = token.address();
    let token_client = StellarAssetClient::new(&env, &token_address);
    let arbitration = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    token_client.mint(&buyer, &1000i128);
    client.initialize(&arbitration, &token_address);
    let vault_id = client.create_vault(&buyer, &seller, &arbitration, &1000i128, &String::from_str(&env, "item"), &7u64);
    client.deposit(&vault_id, &buyer, &token_address);
    // Buyer confirms twice — must not trigger release or panic
    client.confirm(&vault_id, &buyer, &token_address);
    client.confirm(&vault_id, &buyer, &token_address);
    let vault = client.get_vault(&vault_id).expect("vault must exist");
    assert!(vault.buyer_confirmed);
    assert!(!vault.seller_confirmed);
    // Vault must still be Active, awaiting seller confirmation
    assert_eq!(vault.status, VaultStatus::Active);
}

#[test]
#[should_panic(expected = "Can only dispute active vaults")]
fn test_invalid_dispute_on_pending() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowContract, ());
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

    let vault_id = client.create_vault(&buyer, &seller, &arbitration, &1000i128, &String::from_str(&env, "item"), &7u64);

    // This should panic because vault is still Pending
    client.flag_dispute(&vault_id, &buyer, &String::from_str(&env, "reason"));
}
