import React, { useState, useEffect } from "react";
import VaultCard from "../../components/vault/VaultCard";
import ConnectWallet from "../../components/ConnectWallet";
import StatusBanner from "../../components/StatusBanner";
import { Link } from "../../components/Link";
import { Vault } from "../../types";
import {
  getUserVaults,
  confirmVault,
  flagDispute,
  getVault,
  getNativeTokenAddress,
  getWalletNetworkInfo,
} from "../../src/utils/stellar.js";

type NotifType = "success" | "error" | "warning" | "info";
interface Notification {
  type: NotifType;
  message: string;
  txHash?: string;
  explorerUrl?: string;
  autoDismiss?: number;
}
interface WalletNetworkState {
  isMatch: boolean;
  walletNetwork: string;
  expectedNetwork: string;
}

export default function Page() {
  const [address, setAddress] = useState<string>("");
  const [buyerVaults, setBuyerVaults] = useState<Vault[]>([]);
  const [sellerVaults, setSellerVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);

  const [notification, setNotification] = useState<Notification | null>(null);
  const [walletNetwork, setWalletNetwork] = useState<WalletNetworkState | null>(
    null,
  );
  // Tracks which vault's dispute is awaiting confirmation (replaces `confirm()`)
  const [disputePending, setDisputePending] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      loadVaults();
      checkWalletNetwork();
    }
  }, [address]);

  const checkWalletNetwork = async () => {
    try {
      const networkInfo = await getWalletNetworkInfo();
      setWalletNetwork({
        isMatch: networkInfo.isMatch,
        walletNetwork: networkInfo.walletNetwork,
        expectedNetwork: networkInfo.expectedNetwork,
      });
    } catch (error) {
      console.error("Failed to detect wallet network:", error);
      setWalletNetwork({
        isMatch: false,
        walletNetwork: "Unknown",
        expectedNetwork: "Testnet",
      });
    }
  };

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

  const getExplorerUrl = (hash?: string) =>
    hash ? `https://stellar.expert/explorer/testnet/tx/${hash}` : undefined;

  const ensureCorrectNetwork = () => {
    if (!walletNetwork?.isMatch) {
      notify(
        "warning",
        `Wrong wallet network detected (${walletNetwork?.walletNetwork || "Unknown"}). Switch Freighter to ${walletNetwork?.expectedNetwork || "Testnet"} to continue.`,
        { autoDismiss: 0 },
      );
      return false;
    }
    return true;
  };

  const notify = (
    type: NotifType,
    message: string,
    options: Pick<Notification, "txHash" | "explorerUrl" | "autoDismiss"> = {},
  ) => {
    setNotification({ type, message, ...options });
  };

  const handleConfirm = async (vaultId: string) => {
    if (!ensureCorrectNetwork()) return;
    try {
      notify("info", "Transaction submitted. Waiting for Stellar confirmation...", {
        autoDismiss: 0,
      });
      const tx = await confirmVault(vaultId, address, getNativeTokenAddress());
      await loadVaults();
      const fresh = await getVault(vaultId);
      notify(
        "success",
        fresh?.status === "confirmed"
          ? "Both parties confirmed. Funds released to seller."
          : "Confirmation recorded. Waiting for the other party to confirm.",
        {
          txHash: tx?.txHash,
          explorerUrl: getExplorerUrl(tx?.txHash),
        },
      );
    } catch (error: any) {
      console.error("Error confirming vault:", error);
      notify("error", error?.message || "Failed to confirm vault. Please try again.");
    }
  };

  const handleDispute = (vaultId: string) => {
    if (!ensureCorrectNetwork()) return;
    setDisputePending(vaultId);
    setNotification(null);
  };

  const handleDisputeConfirmed = async () => {
    if (!disputePending) return;
    const vaultId = disputePending;
    setDisputePending(null);
    try {
      notify("info", "Transaction submitted. Waiting for Stellar confirmation...", {
        autoDismiss: 0,
      });
      const tx = await flagDispute(vaultId, address);
      await loadVaults();
      notify("success", "Dispute filed! Arbitration process started.", {
        txHash: tx?.txHash,
        explorerUrl: getExplorerUrl(tx?.txHash),
      });
    } catch (error: any) {
      console.error("Error filing dispute:", error);
      notify("error", error?.message || "Failed to file dispute. Please try again.");
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-surface py-20 px-4 animate-fade-in-up">
        <div className="max-w-xl mx-auto text-center space-y-8">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto shadow-sm">
            <span className="material-symbols-outlined text-4xl">
              lock_person
            </span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-on-surface mb-4 tracking-tight">
              Access Your Dashboard
            </h1>
            <p className="text-on-surface-variant text-lg">
              Securely connect your Stellar wallet to manage your escrow vaults
              and track active transactions.
            </p>
          </div>
          <div className="bg-surface-high p-8 rounded-huge border border-outline-variant shadow-xl">
            <ConnectWallet onConnect={setAddress} />
          </div>
          <p className="text-xs text-on-surface-variant/50">
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
    <div className="space-y-12 pb-20 animate-fade-in-up">
      {/* Welcome & Summary Section */}
      <section>
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-on-surface mb-2 tracking-tight">
            Portfolio Overview
          </h1>
          <p className="text-on-surface-variant">
            Real-time performance of your escrow assets on the Stellar network.
          </p>
        </div>

        {/* Inline notifications — replaces browser alert/confirm popups */}
        {notification && (
          <StatusBanner
            type={notification.type}
            message={notification.message}
            txHash={notification.txHash}
            explorerUrl={notification.explorerUrl}
            autoDismiss={notification.autoDismiss}
            onDismiss={() => setNotification(null)}
          />
        )}

        {disputePending && (
          <StatusBanner
            type="warning"
            message="Are you sure you want to dispute this transaction? This will trigger arbitration."
            onDismiss={() => setDisputePending(null)}
            actions={[
              { label: "Proceed with Dispute", onClick: handleDisputeConfirmed, primary: true },
              { label: "Cancel", onClick: () => setDisputePending(null) },
            ]}
          />
        )}

        {address && walletNetwork && !walletNetwork.isMatch && (
          <StatusBanner
            type="warning"
            message={`Wallet network mismatch: ${walletNetwork.walletNetwork}. Switch to ${walletNetwork.expectedNetwork} before submitting actions.`}
            onDismiss={() => setWalletNetwork(null)}
            autoDismiss={0}
            actions={[
              {
                label: "Switch to Testnet Guide",
                onClick: () =>
                  window.open(
                    "https://docs.freighter.app/docs/guide/using-freighter#switching-networks",
                    "_blank",
                    "noopener,noreferrer",
                  ),
                primary: true,
              },
            ]}
          />
        )}

        {/* Summary Cards Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          {/* TVL Card */}
          <div className="bg-surface-high p-8 rounded-2xl border border-outline-variant shadow-sm group hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <span className="material-symbols-outlined">
                  account_balance_wallet
                </span>
              </div>
              <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  trending_up
                </span>
                Active
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
          <div className="bg-surface-high p-8 rounded-2xl border border-outline-variant shadow-sm group hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-surface-low text-primary rounded-xl">
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
          <div className="bg-surface-high p-8 rounded-2xl border border-outline-variant shadow-sm group hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all min-w-0">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-surface-low text-on-surface-variant rounded-xl">
                <span className="material-symbols-outlined">
                  account_circle
                </span>
              </div>
              <span className="text-primary text-xs font-bold">
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
              <h2 className="text-2xl font-bold text-on-surface">
                Your Escrows (Buyer)
              </h2>
              <div className="px-3 py-1 bg-surface-low text-on-surface-variant text-xs font-bold rounded-full uppercase tracking-tight">
                {buyerVaults.length} Total
              </div>
            </div>
            {buyerVaults.length === 0 ? (
              <div className="bg-surface-high border border-outline border-dashed rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-surface-low rounded-full flex items-center justify-center text-on-surface-variant/30 mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl">
                    shopping_cart
                  </span>
                </div>
                <h3 className="text-on-surface font-bold mb-1">
                  No active purchases
                </h3>
                <p className="text-on-surface-variant text-sm mb-6">
                  Create a new vault to start a secure transaction.
                </p>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-primary-dark transition-all"
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
              <h2 className="text-2xl font-bold text-on-surface">
                Your Sales (Seller)
              </h2>
              <div className="px-3 py-1 bg-surface-low text-on-surface-variant text-xs font-bold rounded-full uppercase tracking-tight">
                {sellerVaults.length} Total
              </div>
            </div>
            {sellerVaults.length === 0 ? (
              <div className="bg-surface-high border border-outline border-dashed rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-surface-low rounded-full flex items-center justify-center text-on-surface-variant/30 mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl">
                    storefront
                  </span>
                </div>
                <h3 className="text-on-surface font-bold mb-1">
                  No active sales
                </h3>
                <p className="text-on-surface-variant text-sm">
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
                    onConfirm={handleConfirm}
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
