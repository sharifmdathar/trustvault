import React from "react";

export default function FeeSummaryBox({ className = "" }) {
  return (
    <div
      className={`bg-surface-low border border-outline-variant rounded-2xl p-5 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-primary text-base">
          account_balance_wallet
        </span>
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Fee Summary (Before Signing)
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-on-surface-variant">You pay</span>
          <span className="font-bold text-teal-600">0 XLM</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-on-surface-variant">Sponsor pays</span>
          <span className="font-bold text-on-surface">Network fee</span>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-on-surface-variant">
        TrustVault wraps your signed transaction in a fee-bump transaction so the
        platform covers chain fees.
      </p>
    </div>
  );
}
