import React from "react";
import { Link } from "./Link";
import VaultStatusBadge from "./VaultStatusBadge";
import { Vault } from "../types";

interface VaultCardProps {
  vault: Vault;
  role: "buyer" | "seller";
  onConfirm?: (vaultId: string) => void;
  onDispute?: (vaultId: string) => void;
}

export default function VaultCard({
  vault,
  role,
  onConfirm,
  onDispute,
}: VaultCardProps) {
  const isBuyer = role === "buyer";
  const counterparty = isBuyer ? vault.seller : vault.buyer;

  const canConfirm = isBuyer && vault.status === "funded";
  const canDispute = vault.status === "funded";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-8 hover:shadow-lg transition-all group flex flex-col gap-6 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <span className="material-symbols-outlined">shield_lock</span>
          </div>
          <div>
            <h3 className="font-bold text-on-surface">
              Vault #{vault.id.slice(0, 8)}
            </h3>
            <p className="text-xs text-on-surface-variant font-mono">
              VAULT-{vault.id.slice(0, 4).toUpperCase()}
            </p>
          </div>
        </div>
        <VaultStatusBadge status={vault.status} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 opacity-60">
            Counterparty
          </p>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-slate-200"></div>
            <p className="text-sm font-medium text-on-surface">
              {counterparty.slice(0, 6)}...{counterparty.slice(-4)}
            </p>
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 opacity-60">
            Amount
          </p>
          <p className="text-sm font-bold text-on-surface">
            {vault.amount} XLM
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-on-surface-variant line-clamp-2">
          {vault.description || "Secure escrow transaction on Stellar."}
        </p>
        <div className="flex justify-between text-[10px] text-on-surface-variant font-bold uppercase tracking-tight opacity-60">
          <span>Created: {new Date(vault.createdAt).toLocaleDateString()}</span>
          <span>Deadline: {new Date(vault.deadline).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
        <Link
          href={`/vault/${vault.id}`}
          className="px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-slate-50 rounded-xl transition-colors"
        >
          Details
        </Link>
        {canConfirm && onConfirm && (
          <button
            onClick={() => onConfirm(vault.id)}
            className="flex-1 px-4 py-2 text-sm font-bold text-teal-600 hover:bg-teal-50 rounded-xl transition-colors"
          >
            Release Funds
          </button>
        )}
        {canDispute && onDispute && (
          <button
            onClick={() => onDispute(vault.id)}
            className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            Dispute
          </button>
        )}
      </div>
    </div>
  );
}
