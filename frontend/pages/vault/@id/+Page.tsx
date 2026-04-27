import React, { useState, useEffect } from "react";
import { usePageContext } from "vike-react/usePageContext";
import VaultDetail from "../../../components/vault/VaultDetail";
import ConnectWallet from "../../../components/ConnectWallet";
import {
  getVault,
  getArbitrationCase,
  depositToVault,
  confirmVault,
  flagDispute,
  resolveDispute,
  getNativeTokenAddress,
} from "../../../src/utils/stellar.js";
import { Vault } from "../../../types";

export default function VaultDetailPage() {
  const pageContext = usePageContext();
  const vaultId = pageContext.routeParams?.id as string;
  const [address, setAddress] = useState<string>("");
  const [vault, setVault] = useState<Vault | null>(null);
  const [arbitration, setArbitration] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vaultId) {
      loadVaultData();
    }
  }, [vaultId]);

  const loadVaultData = async () => {
    setLoading(true);
    try {
      const vaultData = await getVault(vaultId!);

      if (vaultData?.status === "disputed") {
        const arbitrationData = await getArbitrationCase(vaultId!);
        setVault({ ...vaultData, arbitration: arbitrationData });
        setArbitration(arbitrationData);
      } else {
        setVault(vaultData);
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
    await depositToVault(vaultId!, address, getNativeTokenAddress());
    await loadVaultData();
    alert("Deposit successful!");
  };

  const handleConfirm = async () => {
    if (!address) {
      alert("Please connect your wallet");
      return;
    }
    await confirmVault(vaultId!, address, getNativeTokenAddress());
    await loadVaultData();
    alert("Vault confirmed! Funds released to seller.");
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

    await flagDispute(vaultId!, address);
    await loadVaultData();
    alert("Dispute filed! Arbitration process started.");
  };

  const handleArbitrationVote = async (decision) => {
    if (!address) {
      alert("Please connect your wallet");
      return;
    }
    const reason = prompt("Enter a reason for your decision:");
    if (reason === null) return;

    await resolveDispute(
      vaultId!,
      address,
      getNativeTokenAddress(),
      decision,
      reason,
    );
    await loadVaultData();
    alert("Resolution submitted successfully!");
  };

  if (!vault && !loading) {
    return (
      <div className="min-h-screen bg-surface py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-on-surface mb-4">
            Vault Not Found
          </h1>
          <p className="text-on-surface-variant">
            The vault you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {!address && (
        <div className="bg-surface-low border border-outline p-4 text-center">
          <p className="text-on-surface-variant mb-3">
            Connect your wallet to interact with this vault
          </p>
          <ConnectWallet onConnect={setAddress} />
        </div>
      )}
      <VaultDetail
        vault={vault}
        address={address}
        onDeposit={handleDeposit}
        onConfirm={handleConfirm}
        onDispute={handleDispute}
        onArbitrationVote={handleArbitrationVote}
        loading={loading}
      />
    </div>
  );
}
