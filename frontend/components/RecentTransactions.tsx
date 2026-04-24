import React, { useState, useEffect } from "react";
import { getRecentTransactions } from "../src/utils/stellar.js";
import { Transaction } from "../types";
import { Link } from "./Link";

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const txs = await getRecentTransactions();
      setTransactions(txs.slice(0, 10));
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading transactions...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
          Recent Activity
        </h2>
        <button
          onClick={loadTransactions}
          className="text-teal-600 hover:text-teal-700 font-bold text-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Refresh Feed
        </button>
      </div>
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="divide-y divide-slate-50">
          {transactions.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">
                  history
                </span>
              </div>
              <p className="text-slate-900 font-bold mb-1">
                No transaction history
              </p>
              <p className="text-slate-500 text-sm">
                Active transactions will appear here in real-time.
              </p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-6 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
                      <span className="material-symbols-outlined">
                        {tx.type === "create"
                          ? "add_box"
                          : tx.type === "fund"
                            ? "payments"
                            : "done_all"}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                          {tx.type.replace("_", " ")}
                        </span>
                        <span className="text-slate-300">•</span>
                        <Link
                          href={`/vault/${tx.vaultId}`}
                          className="text-teal-600 hover:underline text-sm font-bold"
                        >
                          Vault #{tx.vaultId.slice(0, 8)}
                        </Link>
                      </div>
                      <p className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">
                          person
                        </span>
                        {tx.from.slice(0, 8)}...{tx.from.slice(-6)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {tx.amount ? (
                      <p className="text-base font-bold text-slate-900 mb-1">
                        {tx.amount} XLM
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mb-1">
                        Status Update
                      </p>
                    )}
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {new Date(tx.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-tighter ${
                          tx.status === "success"
                            ? "bg-emerald-50 text-emerald-600"
                            : tx.status === "failed"
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
