import React, { useState, useEffect } from "react";
import { usePageContext } from "vike-react/usePageContext";
import ConnectWallet from "../../../components/ConnectWallet";
import VaultStatusBadge from "../../../components/VaultStatusBadge";
import {
  getVault,
  getArbitrationCase,
  depositToVault,
  confirmVault,
  flagDispute,
} from "../../../src/utils/stellar.js";
import { Vault, ArbitrationCase } from "../../../types";
import { Scale, AlertCircle } from "lucide-react";

export default function VaultDetailPage() {
  const pageContext = usePageContext();
  const vaultId = pageContext.routeParams?.id as string;
  const [address, setAddress] = useState<string>("");
  const [vault, setVault] = useState<Vault | null>(null);
  const [arbitration, setArbitration] = useState<ArbitrationCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (vaultId) {
      loadVaultData();
    }
  }, [vaultId]);

  const loadVaultData = async () => {
    setLoading(true);
    try {
      const vaultData = await getVault(vaultId!);
      setVault(vaultData);

      if (vaultData?.status === "disputed") {
        const arbitrationData = await getArbitrationCase(vaultId!);
        setArbitration(arbitrationData);
      }
    } catch (error) {
      console.error("Error loading vault:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!address) {
      alert("Please connect your wallet");
      return;
    }
    setActionLoading(true);
    try {
      await depositToVault(vaultId!, address);
      await loadVaultData();
      alert("Deposit successful!");
    } catch (error) {
      console.error("Error depositing:", error);
      alert("Failed to deposit. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!address) {
      alert("Please connect your wallet");
      return;
    }
    setActionLoading(true);
    try {
      await confirmVault(vaultId!, address);
      await loadVaultData();
      alert("Vault confirmed! Funds released to seller.");
    } catch (error) {
      console.error("Error confirming:", error);
      alert("Failed to confirm. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async () => {
    if (!address) {
      alert("Please connect your wallet");
      return;
    }
    const confirmed = confirm(
      "Are you sure you want to dispute this transaction? This will trigger arbitration.",
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await flagDispute(vaultId!, address);
      await loadVaultData();
      alert("Dispute filed! Arbitration process started.");
    } catch (error) {
      console.error("Error filing dispute:", error);
      alert("Failed to file dispute. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="text-center">Loading vault details...</div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Vault Not Found
          </h1>
          <p className="text-gray-600">
            The vault you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const isBuyer = address === vault.buyer;
  const isSeller = address === vault.seller;
  const canDeposit = vault.status === "pending" && isBuyer;
  const canConfirm = vault.status === "funded" && isBuyer;
  const canDispute = vault.status === "funded" && (isBuyer || isSeller);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Vault #{vault.id.slice(0, 8)}
            </h1>
            <p className="text-gray-500 mt-1">
              Created {new Date(vault.createdAt).toLocaleDateString()}
            </p>
          </div>
          <VaultStatusBadge status={vault.status} />
        </div>

        {/* Main Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-500">Amount</label>
              <p className="text-3xl font-bold text-gray-900">
                {vault.amount} XLM
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Deadline</label>
              <p className="text-gray-900">
                {new Date(vault.deadline).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Buyer</label>
              <p className="font-mono text-sm">{vault.buyer}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Seller</label>
              <p className="font-mono text-sm">{vault.seller}</p>
            </div>
          </div>
        </div>

        {/* Description Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">Description</h2>
          <p className="text-gray-700">{vault.description}</p>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Timeline</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                1
              </div>
              <div className="ml-4 flex-1">
                <p className="font-medium">Vault Created</p>
                <p className="text-sm text-gray-500">
                  {new Date(vault.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            {vault.status !== "pending" && (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                  2
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium">Funds Deposited</p>
                  <p className="text-sm text-gray-500">
                    Buyer deposited {vault.amount} XLM
                  </p>
                </div>
              </div>
            )}
            {vault.status === "confirmed" && (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                  3
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium">Transaction Completed</p>
                  <p className="text-sm text-gray-500">
                    Funds released to seller
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {(canDeposit || canConfirm || canDispute) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              {canDeposit && (
                <button
                  onClick={handleDeposit}
                  disabled={actionLoading}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading
                    ? "Processing..."
                    : `Deposit ${vault.amount} XLM`}
                </button>
              )}
              {canConfirm && (
                <button
                  onClick={handleConfirm}
                  disabled={actionLoading}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading
                    ? "Processing..."
                    : "Confirm Delivery & Release Funds"}
                </button>
              )}
              {canDispute && (
                <button
                  onClick={handleDispute}
                  disabled={actionLoading}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : "File Dispute"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Arbitration Section */}
        {vault.status === "disputed" && arbitration && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Scale className="w-5 h-5 mr-2" />
              Arbitration Status
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-500">Release to Buyer</p>
                  <p className="text-2xl font-bold">{arbitration.votesBuyer}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-500">Release to Seller</p>
                  <p className="text-2xl font-bold">
                    {arbitration.votesSeller}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-500">Split 50/50</p>
                  <p className="text-2xl font-bold">{arbitration.votesSplit}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Total Votes: {arbitration.totalVotes} /{" "}
                {arbitration.arbitrators.length}
              </p>
              {arbitration.resolved && arbitration.decision && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <p className="text-center font-semibold text-purple-900">
                    Resolution: Funds will be released to {arbitration.decision}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Connect Wallet Prompt */}
        {!address && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
            <p className="text-gray-700 mb-4">
              Connect your wallet to interact with this vault
            </p>
            <ConnectWallet onConnect={setAddress} />
          </div>
        )}
      </div>
    </div>
  );
}
