import React, { useState, useEffect, useRef } from "react";
import { usePageContext } from "vike-react/usePageContext";
import VaultDetail from "../../../components/vault/VaultDetail";
import ConnectWallet from "../../../components/ConnectWallet";
import StatusBanner from "../../../components/StatusBanner";
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

type NotifType = "success" | "error" | "warning" | "info";
interface Notification {
  type: NotifType;
  message: string;
}

export default function VaultDetailPage() {
  const pageContext = usePageContext();
  const vaultId = pageContext.routeParams?.id as string;
  const [address, setAddress] = useState<string>("");
  const [vault, setVault] = useState<Vault | null>(null);
  const [arbitration, setArbitration] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [notification, setNotification] = useState<Notification | null>(null);
  // State for the dispute confirmation step (replaces `confirm()`)
  const [disputePending, setDisputePending] = useState(false);
  // State for the arbitration reason input step (replaces `prompt()`)
  const [arbitrationPending, setArbitrationPending] = useState<{
    decision: any;
  } | null>(null);
  const [arbitrationReason, setArbitrationReason] = useState("");
  const arbitrationPanelRef = useRef<HTMLDivElement>(null);
  const arbitrationTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (vaultId) {
      loadVaultData();
    }
  }, [vaultId]);

  useEffect(() => {
    if (arbitrationPending && arbitrationPanelRef.current) {
      arbitrationPanelRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      arbitrationTextareaRef.current?.focus();
    }
  }, [arbitrationPending]);

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
      return vaultData;
    } catch (error) {
      console.error("Error loading vault:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const notify = (type: NotifType, message: string) => {
    setNotification({ type, message });
  };

  const handleDeposit = async () => {
    if (!address) {
      notify("warning", "Please connect your wallet.");
      return;
    }
    try {
      await depositToVault(vaultId!, address, getNativeTokenAddress());
      await loadVaultData();
      notify("success", "Deposit successful!");
    } catch (error: any) {
      console.error("Error depositing:", error);
      notify("error", error?.message || "Deposit failed. Please try again.");
    }
  };

  const handleConfirm = async () => {
    if (!address) {
      notify("warning", "Please connect your wallet.");
      return;
    }
    try {
      await confirmVault(vaultId!, address, getNativeTokenAddress());
      const updatedVault = await loadVaultData();
      notify(
        "success",
        updatedVault?.status === "confirmed"
          ? "Both parties confirmed. Funds released to seller."
          : "Confirmation recorded. Waiting for the other party to confirm.",
      );
    } catch (error: any) {
      console.error("Error confirming vault:", error);
      notify("error", error?.message || "Failed to confirm vault. Please try again.");
    }
  };

  const handleDispute = () => {
    if (!address) {
      notify("warning", "Please connect your wallet.");
      return;
    }
    setDisputePending(true);
    setNotification(null);
  };

  const handleDisputeConfirmed = async () => {
    setDisputePending(false);
    try {
      await flagDispute(vaultId!, address);
      await loadVaultData();
      notify("success", "Dispute filed! Arbitration process started.");
    } catch (error: any) {
      console.error("Error filing dispute:", error);
      notify("error", error?.message || "Failed to file dispute. Please try again.");
    }
  };

  const handleArbitrationVote = (decision: any) => {
    if (!address) {
      notify("warning", "Please connect your wallet.");
      return;
    }
    setArbitrationPending({ decision });
    setArbitrationReason("");
    setNotification(null);
  };

  const handleArbitrationSubmit = async () => {
    if (!arbitrationPending) return;
    const reason = arbitrationReason.trim();
    if (!reason) {
      notify("warning", "Please enter a reason for your decision.");
      return;
    }
    const { decision } = arbitrationPending;
    setArbitrationPending(null);
    setArbitrationReason("");
    try {
      await resolveDispute(
        vaultId!,
        address,
        decision,
        reason,
        getNativeTokenAddress(),
      );
      await loadVaultData();
      notify("success", "Resolution submitted successfully!");
    } catch (error: any) {
      console.error("Error submitting resolution:", error);
      notify("error", error?.message || "Failed to submit resolution. Please try again.");
    }
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

      {/* Inline notifications — replaces all browser alert/confirm/prompt popups */}
      <div className="px-4 pt-4 max-w-4xl mx-auto">
        {notification && (
          <StatusBanner
            type={notification.type}
            message={notification.message}
            onDismiss={() => setNotification(null)}
          />
        )}

        {disputePending && (
          <StatusBanner
            type="warning"
            message="Are you sure you want to dispute this transaction? This will trigger arbitration."
            onDismiss={() => setDisputePending(false)}
            actions={[
              { label: "Proceed with Dispute", onClick: handleDisputeConfirmed, primary: true },
              { label: "Cancel", onClick: () => setDisputePending(false) },
            ]}
          />
        )}

        {arbitrationPending && (
          <div
            ref={arbitrationPanelRef}
            style={{
              backgroundColor: "var(--status-pending-bg)",
              borderColor: "var(--status-pending-border)",
            }}
            className="p-4 rounded-xl border mb-4"
          >
            <p
              style={{ color: "var(--status-pending-text)" }}
              className="text-sm font-semibold mb-3"
            >
              Enter a reason for your arbitration decision:
            </p>
            <textarea
              ref={arbitrationTextareaRef}
              value={arbitrationReason}
              onChange={(e) => setArbitrationReason(e.target.value)}
              placeholder="Describe your reasoning..."
              rows={3}
              className="w-full p-3 rounded-lg border border-outline text-sm text-on-surface bg-surface-high mb-3"
              style={{ resize: "vertical" }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleArbitrationSubmit}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-primary text-white transition-all hover:bg-primary-dark"
              >
                Submit Decision
              </button>
              <button
                onClick={() => {
                  setArbitrationPending(null);
                  setArbitrationReason("");
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold border border-outline text-on-surface-variant transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

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
