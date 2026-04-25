import React from "react";
import { Link } from "../Link";
import StatusBadge from "../ui/StatusBadge";

export default function VaultCard({ vault, role, onConfirm, onDispute }) {
  const isBuyer = role === "buyer";
  const counterparty = isBuyer ? vault.seller : vault.buyer;
  const canConfirm = isBuyer && vault.status === "funded";
  const canDispute = vault.status === "funded";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-6 sm:p-8 hover:shadow-2xl transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <span className="material-symbols-outlined text-4xl">shield</span>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">
            Vault #{vault.id?.slice(0, 8)}
          </h3>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
            {isBuyer ? "Seller" : "Buyer"}: <span className="font-mono text-slate-600">{counterparty?.slice(0, 6)}...{counterparty?.slice(-4)}</span>
          </p>
        </div>
        <StatusBadge status={vault.status} className="scale-110" />
      </div>

      <div className="space-y-4 mb-8 relative z-10">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-teal-600">{vault.amount}</span>
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">XLM</span>
        </div>
        
        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-50 italic">
          "{vault.description || "No specific terms provided."}"
        </p>

        <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
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
            className="flex-1 text-center px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-[0.98]"
          >
            View Details
          </Link>
          {canConfirm && onConfirm && (
            <button
              onClick={() => onConfirm(vault.id)}
              className="flex-[1.5] px-4 py-3 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98]"
            >
              Confirm Delivery
            </button>
          )}
        </div>
        {canDispute && onDispute && (
          <button
            onClick={() => onDispute(vault.id)}
            className="w-full px-4 py-3 bg-white border border-red-100 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-all active:scale-[0.98]"
          >
            Open Dispute
          </button>
        )}
      </div>
    </div>
  );
}
