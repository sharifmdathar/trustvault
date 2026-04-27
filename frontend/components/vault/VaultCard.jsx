import React from "react";
import { Link } from "../Link";
import StatusBadge from "../ui/StatusBadge";

export default function VaultCard({ vault, role, onConfirm, onDispute }) {
  const isBuyer = role === "buyer";
  const counterparty = isBuyer ? vault.seller : vault.buyer;

  // Both parties can confirm when vault is funded (Active)
  const isActive = vault.status === "funded";
  const alreadyConfirmed = isBuyer ? vault.buyerConfirmed : vault.sellerConfirmed;
  const canConfirm = isActive && !alreadyConfirmed;
  const canDispute = isActive;

  // Completed states where no actions should appear
  const isFinalized = ["confirmed", "disputed", "cancelled", "expired"].includes(vault.status);

  return (
    <div className="bg-surface-high rounded-2xl border border-outline-variant shadow-xl p-6 sm:p-8 hover:shadow-2xl transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <span className="material-symbols-outlined text-4xl">shield</span>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-on-surface mb-1">
            Vault #{vault.id?.slice(0, 8)}
          </h3>
          <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-outline rounded-full"></span>
            {isBuyer ? "Seller" : "Buyer"}: <span className="font-mono text-on-surface-variant">{counterparty?.slice(0, 6)}...{counterparty?.slice(-4)}</span>
          </p>
        </div>
        <StatusBadge status={vault.status} className="scale-110" />
      </div>

      <div className="space-y-4 mb-8 relative z-10">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-teal-600">{vault.amount}</span>
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">XLM</span>
        </div>
        
        <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed bg-surface-low p-4 rounded-xl border border-outline italic">
          "{vault.description || "No specific terms provided."}"
        </p>

        {/* Confirmation Progress */}
        {isActive && (
          <div className="flex gap-3 text-xs font-bold">
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${vault.buyerConfirmed ? 'bg-primary/10 text-primary' : 'bg-surface-low text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-sm">{vault.buyerConfirmed ? 'check_circle' : 'pending'}</span>
              Buyer {vault.buyerConfirmed ? '✓' : '…'}
            </span>
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${vault.sellerConfirmed ? 'bg-primary/10 text-primary' : 'bg-surface-low text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-sm">{vault.sellerConfirmed ? 'check_circle' : 'pending'}</span>
              Seller {vault.sellerConfirmed ? '✓' : '…'}
            </span>
          </div>
        )}

        {/* Finalized message */}
        {vault.status === "confirmed" && (
          <div className="flex items-center gap-2 text-sm font-bold text-primary bg-primary/10 px-4 py-2.5 rounded-xl">
            <span className="material-symbols-outlined text-base">verified</span>
            Funds released to seller
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pt-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm opacity-60">calendar_add_on</span>
            {new Date(vault.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm opacity-60">event_busy</span>
            {new Date(vault.deadline).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 relative z-10">
        <div className="flex gap-3">
          <Link
            href={`/vault/${vault.id}`}
            className="flex-1 text-center px-4 py-3 bg-surface-low text-on-surface-variant rounded-xl font-bold text-sm hover:bg-surface-high transition-all active:scale-[0.98]"
          >
            View Details
          </Link>
          {canConfirm && onConfirm && (
            <button
              onClick={() => onConfirm(vault.id)}
              className="flex-[1.5] px-4 py-3 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98]"
            >
              {isBuyer ? "Confirm & Release" : "Confirm Delivery"}
            </button>
          )}
          {isActive && alreadyConfirmed && (
            <div className="flex-[1.5] px-4 py-3 bg-primary/10 text-primary rounded-xl font-bold text-sm text-center border border-primary/20">
              ✓ You Confirmed
            </div>
          )}
        </div>
        {canDispute && !isFinalized && onDispute && (
          <button
            onClick={() => onDispute(vault.id)}
            className="w-full px-4 py-3 bg-surface-high border border-red-500/20 text-red-500 rounded-xl font-bold text-sm hover:bg-red-500/10 transition-all active:scale-[0.98]"
          >
            Open Dispute
          </button>
        )}
      </div>
    </div>
  );
}
