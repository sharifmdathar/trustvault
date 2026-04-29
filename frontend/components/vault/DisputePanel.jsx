import React, { useState } from "react";
import { Scale } from "lucide-react";
import LoadingSpinner from "../ui/LoadingSpinner";

export default function DisputePanel({
  arbitration,
  onVote,
  isArbitrator,
  loading,
  fallbackArbitrator,
}) {
  const [voting, setVoting] = useState(false);
  const quorumRequired = 1;
  const votes = {
    buyer: arbitration?.resolved && arbitration?.decision === "buyer" ? 1 : 0,
    seller: arbitration?.resolved && arbitration?.decision === "seller" ? 1 : 0,
    split: arbitration?.resolved && arbitration?.decision === "split" ? 1 : 0,
  };
  const totalVotes = votes.buyer + votes.seller + votes.split;
  const quorumReached = totalVotes >= quorumRequired;
  const quorumPercent = Math.min(
    100,
    Math.round((totalVotes / quorumRequired) * 100),
  );

  const resolutionReason =
    arbitration?.reason?.trim() ||
    (arbitration?.decision === "buyer"
      ? "Evidence supports releasing funds back to the buyer."
      : arbitration?.decision === "seller"
        ? "Evidence supports releasing funds to the seller."
        : arbitration?.decision === "split"
          ? "Evidence supports a balanced 50/50 settlement."
          : "Resolution reason will appear once arbitration is finalized.");

  const handleVote = async (decision) => {
    if (voting) return;
    setVoting(true);
    try {
      await onVote(decision);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-surface-high rounded-[2rem] border border-outline-variant shadow-2xl p-8 sm:p-10 relative overflow-hidden">
      <h2 className="text-xl font-bold text-on-surface mb-8 flex items-center gap-2">
        <span className="material-symbols-outlined text-amber-600">gavel</span>
        Dispute Resolution
      </h2>

      {!arbitration?.resolved ? (
        <div className="space-y-6">
          <div className="bg-surface-low border border-outline-variant p-6 rounded-2xl">
            <h3 className="text-amber-600 font-bold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">info</span>
              Case Under Review
            </h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              The assigned arbitrator is currently reviewing the evidence provided
              by both parties. A final decision will be reached based on the
              agreement terms.
            </p>
          </div>

          <div className="p-6 bg-surface-low rounded-2xl border border-outline-variant">
            <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-2 tracking-wider opacity-60">
              Assigned Arbitrator
            </p>
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs break-all text-on-surface-variant">
                {arbitration?.arbitrator || fallbackArbitrator || "Retrieving..."}
              </p>
            </div>
          </div>

          <div className="bg-surface-low border border-outline-variant p-6 rounded-2xl">
            <h3 className="text-on-surface font-bold mb-4 flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              Vote Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-xl border border-outline-variant p-3 text-center">
                <p className="text-[10px] uppercase text-on-surface-variant mb-1">
                  Buyer
                </p>
                <p className="text-lg font-bold text-on-surface">{votes.buyer}</p>
              </div>
              <div className="rounded-xl border border-outline-variant p-3 text-center">
                <p className="text-[10px] uppercase text-on-surface-variant mb-1">
                  Seller
                </p>
                <p className="text-lg font-bold text-on-surface">{votes.seller}</p>
              </div>
              <div className="rounded-xl border border-outline-variant p-3 text-center">
                <p className="text-[10px] uppercase text-on-surface-variant mb-1">
                  Split
                </p>
                <p className="text-lg font-bold text-on-surface">{votes.split}</p>
              </div>
            </div>

            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">Quorum Progress</span>
              <span
                className={`font-semibold ${
                  quorumReached ? "text-teal-600" : "text-amber-600"
                }`}
              >
                {totalVotes}/{quorumRequired} votes
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-high border border-outline-variant overflow-hidden">
              <div
                className={`h-full transition-all ${
                  quorumReached ? "bg-teal-600" : "bg-amber-500"
                }`}
                style={{ width: `${quorumPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-on-surface-variant mt-3">
              {quorumReached
                ? "Quorum reached. Case can be finalized on-chain."
                : "Waiting for arbitrator vote to reach quorum."}
            </p>
          </div>

          {isArbitrator && (
            <div className="bg-surface-low rounded-[1.5rem] p-8 text-on-surface mt-8 border border-outline-variant">
              <h3 className="text-lg font-bold mb-6 uppercase tracking-widest text-primary">
                Submit Official Verdict
              </h3>
              <p className="text-on-surface-variant text-xs mb-8 leading-relaxed">
                As the assigned arbitrator, you must choose one of the following
                settlement options. This action is final and will execute the
                asset transfer on-chain.
              </p>
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => handleVote("buyer")}
                  disabled={voting}
                  className="w-full px-6 py-4 bg-teal-600 text-white rounded-xl font-bold text-lg hover:bg-primary-dark transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-teal-600/20"
                >
                  {voting ? <LoadingSpinner size="sm" /> : <>Release to Buyer</>}
                </button>
                <button
                  onClick={() => handleVote("seller")}
                  disabled={voting}
                  className="w-full px-6 py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-red-600/20"
                >
                  {voting ? <LoadingSpinner size="sm" /> : <>Release to Seller</>}
                </button>
                <button
                  onClick={() => handleVote("split")}
                  disabled={voting}
                  className="w-full px-6 py-4 bg-surface-low border border-outline-variant text-on-surface-variant rounded-xl font-bold text-lg hover:bg-surface-high transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                  {voting ? <LoadingSpinner size="sm" /> : <>Split 50/50</>}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-surface-low border border-outline-variant p-6 rounded-2xl">
            <h3 className="text-on-surface font-bold mb-4 flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              Final Vote Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-xl border border-outline-variant p-3 text-center">
                <p className="text-[10px] uppercase text-on-surface-variant mb-1">
                  Buyer
                </p>
                <p className="text-lg font-bold text-on-surface">{votes.buyer}</p>
              </div>
              <div className="rounded-xl border border-outline-variant p-3 text-center">
                <p className="text-[10px] uppercase text-on-surface-variant mb-1">
                  Seller
                </p>
                <p className="text-lg font-bold text-on-surface">{votes.seller}</p>
              </div>
              <div className="rounded-xl border border-outline-variant p-3 text-center">
                <p className="text-[10px] uppercase text-on-surface-variant mb-1">
                  Split
                </p>
                <p className="text-lg font-bold text-on-surface">{votes.split}</p>
              </div>
            </div>

            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">Quorum Status</span>
              <span className="font-semibold text-teal-600">
                Reached ({totalVotes}/{quorumRequired})
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-high border border-outline-variant overflow-hidden">
              <div className="h-full bg-teal-600 transition-all" style={{ width: "100%" }} />
            </div>
          </div>

          <div className="p-8 bg-primary/10 rounded-[2rem] border border-outline-variant flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined text-3xl">
                check_circle
              </span>
            </div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">
              Final Chain Resolution
            </p>
            <h3 className="text-2xl font-black text-on-surface mb-4">
              Funds released to{" "}
              <span className="capitalize">{arbitration.decision}</span>
            </h3>
            <div className="bg-surface-high p-6 rounded-2xl border border-outline-variant max-w-md w-full text-left">
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant mb-2">
                Resolution Reason
              </p>
              <p className="text-xs text-on-surface-variant italic leading-relaxed">
                "{resolutionReason}"
              </p>
            </div>
            <p className="mt-8 text-[10px] text-on-surface-variant/50 font-mono uppercase">
              Resolved by {arbitration.arbitrator?.slice(0, 8)}...{arbitration.arbitrator?.slice(-8)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
