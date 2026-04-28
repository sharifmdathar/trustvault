import React, { useState, useEffect } from "react";
import { useVaultEvents } from "../../src/hooks/useVaultEvents";
import { getAllVaults } from "../../src/utils/stellar";
import { Vault } from "../../types";

export default function MetricsPage() {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [showHistory, setShowHistory] = useState(true);
  const { liveEvents, historicalEvents } = useVaultEvents(null);

  useEffect(() => {
    loadData();
  }, []);

  // Timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(
        Math.floor((new Date().getTime() - lastRefreshed.getTime()) / 1000),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [lastRefreshed]);

  // Refresh data when live events occur
  useEffect(() => {
    if (liveEvents.length > 0) {
      console.log("Live event detected, refreshing metrics...");
      loadData(true);
    }
  }, [liveEvents.length]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const allVaults = await getAllVaults();
      setVaults(allVaults);
      setLastRefreshed(new Date());
      setSecondsAgo(0);
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Calculate metrics
  const totalVaults = vaults.length;
  const totalXlmEscrowed = vaults.reduce((acc, v) => {
    // Only count active/funded vaults
    if (v.status === "funded" || v.status === "disputed") {
      return acc + parseFloat(v.amount);
    }
    return acc;
  }, 0);

  const confirmedVaults = vaults.filter((v) => v.status === "confirmed").length;
  const successRate =
    totalVaults > 0 ? (confirmedVaults / totalVaults) * 100 : 0;

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-on-surface mb-2 tracking-tight">
            Protocol Analytics
          </h1>
          <p className="text-on-surface-variant">
            Real-time network visibility and escrow efficiency metrics.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-low rounded-xl border border-outline-variant shadow-sm self-start">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Last update: <span className="font-mono">{secondsAgo}s</span> ago
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Ecosystem Vaults"
          value={totalVaults}
          icon="account_balance"
          subtitle="All time created"
        />
        <StatCard
          title="Total Value Locked"
          value={`${totalXlmEscrowed.toLocaleString()} XLM`}
          icon="lock"
          subtitle="Currently in escrow"
        />
        <StatCard
          title="Fulfillment Rate"
          value={`${successRate.toFixed(1)}%`}
          icon="verified"
          subtitle="Successful releases"
        />
        <StatCard
          title="Live Network Events"
          value={liveEvents.length}
          highlight
          icon="sensors"
          subtitle="Current session"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Live Activity Feed */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-outline-variant bg-surface-low/50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-on-surface flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse"></span>
              Live Ledger Activity
            </h2>
            <div className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded uppercase">
              Live
            </div>
          </div>
          <div
            className="p-6 space-y-4 custom-scrollbar"
            style={{
              maxHeight: "65vh",
              overflowY: "auto",
              overscrollBehavior: "contain",
            }}
          >
            {liveEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                  <span className="material-symbols-outlined animate-spin">
                    refresh
                  </span>
                </div>
                <p className="text-slate-400 text-sm font-medium italic">
                  Listening for Stellar ledger events...
                </p>
              </div>
            ) : (
              liveEvents.map((event: any, i) => (
                <EventItem key={event.id || i} event={event} isLive />
              ))
            )}
          </div>
        </div>

        {/* Historical Events */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-outline-variant bg-surface-low/50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-on-surface flex items-center">
              <span className="material-symbols-outlined text-on-surface-variant mr-2">
                history
              </span>
              Event History
            </h2>
            <div className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
              Sync
            </div>
          </div>

          {showHistory && (
            <div
              className="p-6 space-y-3 custom-scrollbar"
              style={{
                maxHeight: "65vh",
                overflowY: "auto",
                overscrollBehavior: "contain",
              }}
            >
              {historicalEvents.length === 0 ? (
                <p className="text-slate-400 italic text-sm text-center py-12">
                  No historical data found for this session.
                </p>
              ) : (
                historicalEvents.map((event: any, i) => (
                  <EventItem key={event.id || i} event={event} />
                ))
              )}
            </div>
          )}
        </div>

        {/* Network Infrastructure */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-surface-high rounded-2xl p-6 border border-outline-variant shadow-lg relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-teal-600">
                  hub
                </span>
                Network Status
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-outline-variant">
                  <span className="text-on-surface-variant text-sm font-medium">
                    Environment
                  </span>
                  <span className="px-2 py-0.5 bg-teal-500/10 text-teal-600 rounded text-[10px] font-bold uppercase border border-teal-500/20">
                    Testnet
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-outline-variant">
                  <span className="text-on-surface-variant text-sm font-medium">
                    Status
                  </span>
                  <span className="text-sm font-bold flex items-center gap-1.5 text-emerald-600">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Operational
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-outline-variant">
                  <span className="text-on-surface-variant text-sm font-medium">
                    Ledger
                  </span>
                  <span className="text-sm font-mono text-teal-600 font-bold">
                    Horizon 2.0
                  </span>
                </div>
                <button
                  onClick={() => loadData()}
                  className="w-full mt-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all text-sm font-bold shadow-lg shadow-teal-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">
                    sync
                  </span>
                  Manual Refresh
                </button>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] dark:opacity-[0.07] group-hover:scale-110 transition-transform duration-700">
              <span className="material-symbols-outlined text-[10rem] text-on-surface">
                settings_input_antenna
              </span>
            </div>
          </div>

          <div className="bg-primary-container/10 border border-teal-600/20 rounded-2xl p-6">
            <h4 className="text-teal-600 font-bold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">
                security_update_good
              </span>
              Security Protocol
            </h4>
            <p className="text-on-surface-variant text-xs leading-relaxed opacity-80">
              Real-time monitoring of Stellar network consensus. All trustvault
              transactions are secured by multi-sig escrow logic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function truncateId(id: string, start = 6, end = 4) {
  if (!id || id.length <= start + end) return id;
  return `${id.slice(0, start)}...${id.slice(-end)}`;
}

function formatDetails(details: string) {
  return details
    .split(" ")
    .map((word) => {
      if ((word.startsWith("G") || word.startsWith("C")) && word.length > 50) {
        return truncateId(word, 6, 6);
      }
      return word;
    })
    .join(" ");
}

function EventItem({ event, isLive = false }) {
  return (
    <div
      className={`border-l-4 ${isLive ? "border-teal-500 bg-teal-50/30" : "border-outline bg-surface-low/50"} pl-4 py-4 rounded-r-xl transition-all mb-3 hover:shadow-sm`}
    >
      <div className="flex justify-between items-start mb-2">
        <span
          className={`font-bold uppercase text-[10px] tracking-widest ${isLive ? "text-teal-700" : "text-on-surface-variant"}`}
        >
          {event.type}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-on-surface-variant font-mono opacity-60">
            Ledger #{event.ledger}
          </span>
        </div>
      </div>
      <p className="text-sm text-on-surface font-medium leading-relaxed mb-3 break-all">
        {formatDetails(event.details)}
      </p>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant">
        <p
          className="text-[10px] text-on-surface-variant font-mono opacity-60"
          title={event.hash}
        >
          TX: {truncateId(event.hash, 8, 8)}
        </p>
        <span className="material-symbols-outlined text-on-surface-variant text-sm opacity-40">
          open_in_new
        </span>
      </div>
    </div>
  );
}

function StatCard({ title, value, highlight = false, icon, subtitle }) {
  return (
    <div
      className={`bg-white p-8 rounded-2xl border ${highlight ? "border-teal-600/30 shadow-md" : "border-slate-100 shadow-sm"} flex flex-col gap-4 group hover:border-teal-600/30 transition-all`}
    >
      <div className="flex justify-between items-start">
        <div
          className={`p-3 rounded-xl ${highlight ? "bg-teal-600 text-white" : "bg-teal-50 text-teal-600"}`}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {highlight && (
          <div className="px-2 py-0.5 bg-teal-50 text-teal-600 text-[10px] font-bold rounded uppercase">
            Active
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider opacity-60">
          {title}
        </p>
        <h2 className="text-2xl font-bold text-on-surface">{value}</h2>
        <p className="text-xs text-on-surface-variant mt-1 opacity-60">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
