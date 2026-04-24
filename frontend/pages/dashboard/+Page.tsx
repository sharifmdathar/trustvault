import React, { useState, useEffect } from "react";
import VaultCard from "../../components/vault/VaultCard";
import ConnectWallet from "../../components/ConnectWallet";
import { Vault } from "../../types";
import {
  getUserVaults,
  confirmVault,
  flagDispute,
} from "../../src/utils/stellar.js";

export default function Page() {
  const [address, setAddress] = useState<string>("");
  const [buyerVaults, setBuyerVaults] = useState<Vault[]>([]);
  const [sellerVaults, setSellerVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      loadVaults();
    }
  }, [address]);

  const loadVaults = async () => {
    setLoading(true);
    try {
      const vaults = await getUserVaults(address);
      setBuyerVaults(vaults.filter((v) => v.buyer === address));
      setSellerVaults(vaults.filter((v) => v.seller === address));
    } catch (error) {
      console.error("Error loading vaults:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (vaultId: string) => {
    try {
      await confirmVault(vaultId, address);
      await loadVaults();
      alert("Vault confirmed! Funds released to seller.");
    } catch (error) {
      console.error("Error confirming vault:", error);
      alert("Failed to confirm vault. Please try again.");
    }
  };

  const handleDispute = async (vaultId: string) => {
    const confirmed = confirm(
      "Are you sure you want to dispute this transaction?",
    );
    if (!confirmed) return;

    try {
      await flagDispute(vaultId, address);
      await loadVaults();
      alert("Dispute filed! Arbitration process started.");
    } catch (error) {
      console.error("Error filing dispute:", error);
      alert("Failed to file dispute. Please try again.");
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-surface py-20 px-4">
        <div className="max-w-xl mx-auto text-center space-y-8">
          <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mx-auto shadow-sm">
            <span className="material-symbols-outlined text-4xl">
              lock_person
            </span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Access Your Dashboard
            </h1>
            <p className="text-slate-500 text-lg">
              Securely connect your Stellar wallet to manage your escrow vaults
              and track active transactions.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl">
            <ConnectWallet onConnect={setAddress} />
          </div>
          <p className="text-xs text-slate-400">
            By connecting, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    );
  }

  const totalBalance = [...buyerVaults, ...sellerVaults].reduce(
    (acc, v) => acc + Number(v.amount),
    0,
  );
  const activeCount = [...buyerVaults, ...sellerVaults].filter(
    (v) => v.status === "funded",
  ).length;

  return (
    <div className="space-y-12 pb-20">
      {/* Welcome & Summary Section */}
      <section>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">
            Portfolio Overview
          </h1>
          <p className="text-slate-500">
            Real-time performance of your escrow assets on the Stellar network.
          </p>
        </div>

        {/* Summary Cards Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* TVL Card */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm group hover:border-teal-600/30 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <span className="material-symbols-outlined">
                  account_balance_wallet
                </span>
              </div>
              <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  trending_up
                </span>
                +100%
              </span>
            </div>
            <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider opacity-60">
              Total Value Locked
            </p>
            <h2 className="text-3xl font-bold text-on-surface">
              {totalBalance.toLocaleString()} XLM
            </h2>
            <p className="text-xs text-on-surface-variant mt-2 font-mono opacity-60">
              Portfolio Value
            </p>
          </div>

          {/* Active Vaults Card */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm group hover:border-teal-600/30 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-blue-50 text-teal-600 rounded-xl">
                <span className="material-symbols-outlined">shield_lock</span>
              </div>
              <span className="text-on-surface-variant text-xs font-medium opacity-60">
                {activeCount} Pending Release
              </span>
            </div>
            <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider opacity-60">
              Active Vaults
            </p>
            <h2 className="text-3xl font-bold text-on-surface">
              {activeCount}
            </h2>
            <div className="w-full bg-surface-low h-1.5 rounded-full mt-4">
              <div
                className="bg-teal-600 h-1.5 rounded-full"
                style={{ width: activeCount > 0 ? "65%" : "0%" }}
              ></div>
            </div>
          </div>

          {/* Connected Account Card */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm group hover:border-teal-600/30 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-surface-low text-on-surface-variant rounded-xl">
                <span className="material-symbols-outlined">
                  account_circle
                </span>
              </div>
              <span className="text-teal-600 text-xs font-bold">
                Stellar Network
              </span>
            </div>
            <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider opacity-60">
              Connected Wallet
            </p>
            <h2 className="text-lg font-bold text-on-surface truncate">
              {address}
            </h2>
            <p className="text-xs text-on-surface-variant mt-2 font-mono opacity-60">
              Main Account
            </p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-teal-600/20 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">
            Synchronizing with Stellar Ledger...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {/* Buyer Vaults */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Your Escrows (Buyer)
              </h2>
              <div className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase tracking-tight">
                {buyerVaults.length} Total
              </div>
            </div>
            {buyerVaults.length === 0 ? (
              <div className="bg-white border border-slate-100 border-dashed rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl">
                    shopping_cart
                  </span>
                </div>
                <h3 className="text-slate-900 font-bold mb-1">
                  No active purchases
                </h3>
                <p className="text-slate-500 text-sm mb-6">
                  Create a new vault to start a secure transaction.
                </p>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Create New Vault
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {buyerVaults.map((vault) => (
                  <VaultCard
                    key={vault.id}
                    vault={vault}
                    role="buyer"
                    onConfirm={handleConfirm}
                    onDispute={handleDispute}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Seller Vaults */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Your Sales (Seller)
              </h2>
              <div className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase tracking-tight">
                {sellerVaults.length} Total
              </div>
            </div>
            {sellerVaults.length === 0 ? (
              <div className="bg-white border border-slate-100 border-dashed rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl">
                    storefront
                  </span>
                </div>
                <h3 className="text-slate-900 font-bold mb-1">
                  No active sales
                </h3>
                <p className="text-slate-500 text-sm">
                  Provide your wallet address to buyers to receive escrowed
                  funds.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellerVaults.map((vault) => (
                  <VaultCard
                    key={vault.id}
                    vault={vault}
                    role="seller"
                    onDispute={handleDispute}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
