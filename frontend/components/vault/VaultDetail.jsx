import React, { useState } from "react";
import StatusBadge from "../ui/StatusBadge";
import LoadingSpinner from "../ui/LoadingSpinner";
import CopyableAddress from "../ui/CopyableAddress";
import TransactionStatus from "../ui/TransactionStatus";
import FeeSummaryBox from "../ui/FeeSummaryBox";
import DisputePanel from "./DisputePanel";

export default function VaultDetail({
  vault,
  address,
  onDeposit,
  onConfirm,
  onDispute,
  onArbitrationVote,
  loading,
  txStatus,
}) {
  const [actionLoading, setActionLoading] = useState(false);

  const isBuyer = address?.toUpperCase() === vault?.buyer?.toUpperCase();
  const isSeller = address?.toUpperCase() === vault?.seller?.toUpperCase();
  const canDeposit = vault?.status === "pending" && isBuyer;
  const canConfirm =
    vault?.status === "funded" &&
    ((isBuyer && !vault?.buyerConfirmed) ||
      (isSeller && !vault?.sellerConfirmed));
  const canDispute = vault?.status === "funded";
  const hasParticipantConfirmation = Boolean(
    vault?.buyerConfirmed || vault?.sellerConfirmed,
  );

  const currentStepKey =
    vault?.status === "pending"
      ? "created"
      : vault?.status === "funded"
        ? "delivered"
        : vault?.status === "disputed"
          ? "confirmedOrDisputed"
          : vault?.status === "confirmed" || vault?.status === "resolved"
            ? "released"
            : "created";

  const timelineSteps = [
    { key: "created", label: "Created", description: "Vault initialized" },
    { key: "funded", label: "Funded", description: "Buyer deposited escrow" },
    {
      key: "delivered",
      label: "Delivered",
      description: "Work delivery phase in progress",
    },
    {
      key: "confirmedOrDisputed",
      label: "Confirmed / Disputed",
      description:
        vault?.status === "disputed"
          ? "Dispute opened for arbitration"
          : "Parties confirm completion or raise dispute",
    },
    {
      key: "released",
      label: "Released",
      description:
        vault?.status === "resolved"
          ? "Released after arbitration resolution"
          : "Funds released to recipient",
    },
  ];

  const currentStepIndex = timelineSteps.findIndex(
    (step) => step.key === currentStepKey,
  );

  const handleAction = async (action, handler) => {
    setActionLoading(true);
    try {
      await handler();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="bg-surface-high rounded-huge border border-outline-variant shadow-xl p-8 sm:p-10 mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-2xl">
                shield_lock
              </span>
            </div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
              Protocol Secured Vault
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight mb-2">
            Vault{" "}
            <span className="text-teal-600">#{vault?.id?.slice(0, 8)}</span>
          </h1>
          <p className="text-on-surface-variant flex items-center gap-2 opacity-80 font-medium">
            <span className="material-symbols-outlined text-sm">
              calendar_today
            </span>
            Agreement deployed on{" "}
            {new Date(vault?.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3 relative z-10">
          <StatusBadge
            status={vault?.status}
            className="scale-125 origin-right"
          />
          <p className="text-[10px] font-mono text-on-surface-variant opacity-50 uppercase tracking-tighter">
            Verified on Stellar Ledger
          </p>
        </div>
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <span className="material-symbols-outlined text-[15rem]">
            verified
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info Card */}
          <div className="bg-surface-high rounded-huge border border-outline-variant shadow-xl p-8 sm:p-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-10">
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-2 tracking-wider opacity-60">
                  Escrowed Amount
                </p>
                <p className="text-4xl font-bold text-teal-600">
                  {vault?.amount}{" "}
                  <span className="text-sm text-on-surface-variant font-medium">
                    XLM
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-2 tracking-wider opacity-60">
                  Settlement Deadline
                </p>
                <p className="text-xl font-bold text-on-surface">
                  {new Date(vault?.deadline).toLocaleDateString()}
                </p>
                <p className="text-xs text-on-surface-variant mt-1 opacity-80">
                  Automatic arbitration after this date
                </p>
              </div>
            </div>

            <div className="space-y-6 pt-10 border-t border-outline-variant">
              <div className="flex items-center justify-between">
                <CopyableAddress
                  address={vault?.buyer}
                  label="Origin (Buyer)"
                  startChars={8}
                  endChars={6}
                />
              </div>
              <div className="flex items-center justify-between">
                <CopyableAddress
                  address={vault?.seller}
                  label="Destination (Seller)"
                  startChars={8}
                  endChars={6}
                />
              </div>
              <div className="flex items-center justify-between">
                <CopyableAddress
                  address={vault?.arbitrator}
                  label="Assigned Arbitrator"
                  startChars={8}
                  endChars={6}
                />
              </div>
            </div>
          </div>

        </div>

        <div className="lg:col-span-1 space-y-8 h-fit lg:sticky lg:top-24">
          {/* Actions Card */}
          {canDeposit || canConfirm || canDispute ? (
            <div className="bg-surface-high rounded-huge border border-outline-variant shadow-2xl p-8 sm:p-10 relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-600">
                    bolt
                  </span>
                  Active Actions
                </h2>
                <div className="space-y-4">
                  <FeeSummaryBox />
                  {canDeposit && (
                    <button
                      onClick={() => handleAction("deposit", onDeposit)}
                      disabled={actionLoading}
                      className="w-full bg-teal-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98] disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        `Deposit XLM`
                      )}
                    </button>
                  )}
                  {canConfirm && (
                    <button
                      onClick={() => handleAction("confirm", onConfirm)}
                      disabled={actionLoading}
                      className="w-full bg-teal-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98] disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        "Confirm & Release"
                      )}
                    </button>
                  )}
                  {canDispute && (
                    <button
                      onClick={() => handleAction("dispute", onDispute)}
                      disabled={actionLoading}
                      className="w-full bg-surface-low border border-outline-variant text-on-surface-variant px-6 py-4 rounded-xl font-bold text-lg hover:bg-surface-high transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        "Open Dispute"
                      )}
                    </button>
                  )}
                </div>
                {txStatus?.status && (
                  <div className="mt-6 p-4 bg-surface-low rounded-xl border border-outline-variant">
                    <TransactionStatus
                      status={txStatus.status}
                      hash={txStatus.hash}
                      error={txStatus.error}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-surface-high rounded-huge p-8 sm:p-10 border border-outline-variant shadow-xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-primary">
                  verified
                </span>
                Governance Active
              </h3>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                This vault is currently being managed by the protocol logic. No
                manual actions are available at this stage.
              </p>
              <div className="p-4 bg-surface-low rounded-xl border border-outline-variant text-xs font-mono text-primary truncate">
                Status: {vault?.status?.toUpperCase()}
              </div>
            </div>
          )}

          {/* Dispute Info */}
          {(vault?.status === "disputed" || vault?.status === "resolved") && (
            <DisputePanel
              arbitration={vault.arbitration}
              onVote={onArbitrationVote}
              isArbitrator={address?.toUpperCase() === vault.arbitrator?.toUpperCase()}
              loading={loading}
              fallbackArbitrator={vault.arbitrator}
            />
          )}

          {/* Timeline */}
          <div className="bg-surface-high rounded-huge border border-outline-variant shadow-xl p-8">
            <h2 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400">
                history
              </span>
              Escrow Timeline
            </h2>
            <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline">
              {timelineSteps.map((step, index) => {
                const isCompleted =
                  index < currentStepIndex ||
                  (step.key === "delivered" && hasParticipantConfirmation);
                const isCurrent = index === currentStepIndex;

                return (
                  <div
                    key={step.key}
                    className="flex items-start relative z-10"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isCompleted
                          ? "bg-teal-600 text-white shadow-lg shadow-teal-600/30"
                          : isCurrent
                            ? "bg-primary text-white shadow-lg shadow-primary/30"
                            : "bg-surface-low text-on-surface-variant"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="ml-4 flex-1">
                      <p
                        className={`font-bold text-xs ${
                          isCompleted || isCurrent
                            ? "text-on-surface"
                            : "text-on-surface-variant"
                        }`}
                      >
                        {step.label}
                        {isCurrent && (
                          <span className="ml-2 text-[10px] font-medium text-primary">
                            (Current)
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-on-surface-variant">
                        {step.key === "created"
                          ? new Date(vault?.createdAt).toLocaleDateString()
                          : step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="bg-surface-high rounded-huge border border-outline-variant shadow-xl p-8">
            <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400">
                subject
              </span>
              Agreement Terms
            </h2>
            <p className="text-on-surface-variant text-sm leading-relaxed bg-surface-low p-4 rounded-xl border border-outline italic">
              "
              {vault?.description ||
                "No specific terms provided."}
              "
            </p>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
            <h4 className="text-primary font-bold mb-2 flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-sm">info</span>
              Security Protocol
            </h4>
            <p className="text-on-surface-variant text-[10px] leading-relaxed">
              Once funds are released, they cannot be clawed back by TrustVault.
              Ensure the delivery is verified before confirming.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
