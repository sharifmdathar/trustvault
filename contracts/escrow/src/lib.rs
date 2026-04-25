#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[derive(Clone, PartialEq, Debug)]
#[contracttype]
pub enum VaultStatus {
    Pending,
    Active,
    Confirmed,
    Disputed,
    Cancelled,
    Expired,
}

#[derive(Clone)]
#[contracttype]
pub struct Vault {
    pub id: u64,
    pub buyer: Address,
    pub seller: Address,
    pub amount: i128,
    pub description: Symbol,
    pub deadline: u64,
    pub status: VaultStatus,
    pub buyer_confirmed: bool,
    pub seller_confirmed: bool,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Vault(u64),
    VaultCount,
    ArbitrationContract,
    TokenContract,
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    pub fn initialize(env: Env, arbitration_contract: Address, token_contract: Address) {
        if token_contract == env.current_contract_address() {
            panic!("Token contract cannot be the same as the escrow contract");
        }

        env.storage()
            .instance()
            .set(&DataKey::ArbitrationContract, &arbitration_contract);
        env.storage()
            .instance()
            .set(&DataKey::TokenContract, &token_contract);

        if !env.storage().instance().has(&DataKey::VaultCount) {
            env.storage().instance().set(&DataKey::VaultCount, &0u64);
        }
    }

    pub fn create_vault(
        env: Env,
        buyer: Address,
        seller: Address,
        amount: i128,
        description: Symbol,
        deadline_days: u64,
    ) -> u64 {
        buyer.require_auth();

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
            amount,
            description,
            deadline,
            status: VaultStatus::Pending,
            buyer_confirmed: false,
            seller_confirmed: false,
        };

        env.storage().instance().set(&DataKey::Vault(count), &vault);
        env.storage().instance().set(&DataKey::VaultCount, &count);

        env.events()
            .publish((symbol_short!("created"), buyer), (count, seller, amount));

        count
    }

    pub fn deposit(env: Env, vault_id: u64, buyer: Address) {
        buyer.require_auth();

        let mut vault: Vault = env
            .storage()
            .instance()
            .get(&DataKey::Vault(vault_id))
            .expect("Vault not found");

        if vault.status != VaultStatus::Pending {
            panic!("Vault not in pending state");
        }

        if vault.buyer != buyer {
            panic!("Only buyer can deposit");
        }

        let token_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenContract)
            .expect("Token contract not initialized");

        let token_client = soroban_sdk::token::Client::new(&env, &token_contract);
        token_client.transfer(&buyer, &env.current_contract_address(), &vault.amount);

        vault.status = VaultStatus::Active;
        env.storage()
            .instance()
            .set(&DataKey::Vault(vault_id), &vault);

        env.events()
            .publish((symbol_short!("deposit"), buyer), (vault_id, vault.amount));
    }

    pub fn confirm(env: Env, vault_id: u64, caller: Address) {
        caller.require_auth();

        let mut vault: Vault = env
            .storage()
            .instance()
            .get(&DataKey::Vault(vault_id))
            .expect("Vault not found");

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

        // Auto-release if both confirmed
        if vault.buyer_confirmed && vault.seller_confirmed {
            vault.status = VaultStatus::Confirmed;

            let token_contract: Address = env
                .storage()
                .instance()
                .get(&DataKey::TokenContract)
                .expect("Token contract not initialized");

            let token_client = soroban_sdk::token::Client::new(&env, &token_contract);
            token_client.transfer(
                &env.current_contract_address(),
                &vault.seller,
                &vault.amount,
            );

            env.events().publish(
                (symbol_short!("released"), vault.seller.clone()),
                (vault_id, vault.amount),
            );
        }

        env.storage()
            .instance()
            .set(&DataKey::Vault(vault_id), &vault);
    }

    pub fn flag_dispute(env: Env, vault_id: u64, caller: Address) {
        caller.require_auth();

        let mut vault: Vault = env
            .storage()
            .instance()
            .get(&DataKey::Vault(vault_id))
            .expect("Vault not found");

        if vault.status != VaultStatus::Active {
            panic!("Can only dispute active vaults");
        }

        if caller != vault.buyer && caller != vault.seller {
            panic!("Not a vault participant");
        }

        vault.status = VaultStatus::Disputed;
        env.storage()
            .instance()
            .set(&DataKey::Vault(vault_id), &vault);

        env.events()
            .publish((symbol_short!("disputed"), caller), vault_id);
    }

    pub fn get_vault(env: Env, vault_id: u64) -> Vault {
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

    pub fn get_token_contract(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::TokenContract)
            .expect("Token contract not initialized")
    }

    pub fn get_arbitration_contract(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::ArbitrationContract)
            .expect("Arbitration contract not initialized")
    }
}

mod test;
