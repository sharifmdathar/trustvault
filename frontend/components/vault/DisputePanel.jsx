import React, { useState } from "react";
import { Scale, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import LoadingSpinner from "../ui/LoadingSpinner";

export default function DisputePanel({
  arbitration,
  onVote,
  isArbitrator,
  loading,
}) {
  const [voting, setVoting] = useState(false);

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
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl p-8 sm:p-10 relative overflow-hidden">
      <h2 className="text-xl font-bold text-on-surface mb-8 flex items-center gap-2">
        <span className="material-symbols-outlined text-amber-600">gavel</span>
        Arbitration Governance
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-emerald-50 rounded-2xl text-center border border-emerald-100">
          <span className="material-symbols-outlined text-emerald-600 text-3xl mb-2">
            person
          </span>
          <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1 opacity-60">
            To Buyer
          </p>
          <p className="text-3xl font-black text-emerald-900">
            {arbitration?.votesBuyer || 0}
          </p>
        </div>
        <div className="p-6 bg-red-50 rounded-2xl text-center border border-red-100">
          <span className="material-symbols-outlined text-red-600 text-3xl mb-2">
            storefront
          </span>
          <p className="text-[10px] font-bold text-red-800 uppercase tracking-widest mb-1 opacity-60">
            To Seller
          </p>
          <p className="text-3xl font-black text-red-900">
            {arbitration?.votesSeller || 0}
          </p>
        </div>
        <div className="p-6 bg-surface-low rounded-2xl text-center border border-outline-variant">
          <span className="material-symbols-outlined text-on-surface-variant text-3xl mb-2">
            balance
          </span>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">
            Split 50/50
          </p>
          <p className="text-3xl font-black text-on-surface">
            {arbitration?.votesSplit || 0}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2 border-surface bg-surface-low"
              ></div>
            ))}
          </div>
          <p className="text-xs text-on-surface-variant font-bold uppercase tracking-tight opacity-60">
            {arbitration?.totalVotes || 0} /{" "}
            {arbitration?.arbitrators?.length || 0} Arbitrators Voted
          </p>
        </div>
      </div>

      {isArbitrator && !arbitration?.resolved && (
        <div className="bg-slate-900 rounded-[1.5rem] p-6 text-white">
          <h3 className="text-sm font-bold mb-4 uppercase tracking-widest text-teal-400">
            Cast Your Verdict
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleVote("buyer")}
              disabled={voting}
              className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {voting ? <LoadingSpinner size="sm" /> : "Buyer"}
            </button>
            <button
              onClick={() => handleVote("seller")}
              disabled={voting}
              className="px-4 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {voting ? <LoadingSpinner size="sm" /> : "Seller"}
            </button>
            <button
              onClick={() => handleVote("split")}
              disabled={voting}
              className="px-4 py-3 bg-slate-700 text-white rounded-xl font-bold text-sm hover:bg-slate-600 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {voting ? <LoadingSpinner size="sm" /> : "Split"}
            </button>
          </div>
        </div>
      )}

      {arbitration?.resolved && arbitration?.decision && (
        <div className="mt-6 p-6 bg-teal-50 rounded-2xl border border-teal-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1">
              Final Resolution
            </p>
            <p className="text-lg font-bold text-teal-900">
              Funds released to{" "}
              <span className="capitalize">{arbitration.decision}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
