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
    <div className="min-h-screen bg-gray-50 pt-4 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-baseline mb-6">
          <h1 className="text-3xl font-bold">Protocol Metrics</h1>
          <div className="text-sm text-gray-500 mb-1">
            Last update: <span className="font-mono">{secondsAgo}s</span> ago
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Vaults" value={totalVaults} />
          <StatCard title="XLM in Escrow" value={totalXlmEscrowed.toFixed(2)} />
          <StatCard title="Success Rate" value={`${successRate.toFixed(1)}%`} />
          <StatCard title="Live Events" value={liveEvents.length} highlight />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Live Activity Feed */}
          <div className="bg-white rounded-lg shadow-md p-6 h-fit">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
              Live Feed
            </h2>
            <div
              className="space-y-4 pr-2 custom-scrollbar"
              style={{
                maxHeight: "60vh",
                overflowY: "auto",
                overscrollBehavior: "contain",
              }}
            >
              {liveEvents.length === 0 ? (
                <p className="text-gray-500 italic">
                  Waiting for new events...
                </p>
              ) : (
                liveEvents.map((event: any, i) => (
                  <EventItem key={event.id || i} event={event} isLive />
                ))
              )}
            </div>
          </div>

          {/* Network Status */}
          <div className="bg-white rounded-lg shadow-md p-6 h-fit sticky top-24">
            <h2 className="text-xl font-bold mb-4">Network Status</h2>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Network</span>
                <span className="font-medium text-green-600">Testnet</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Status</span>
                <span className="font-medium text-green-600">Operational</span>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => loadData()}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors text-sm font-medium"
                >
                  Refresh Metrics
                </button>
              </div>
            </div>
          </div>

          {/* History Section */}
          <div className="bg-white rounded-lg shadow-md p-6 h-fit">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Event History</h2>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                {showHistory ? "Hide" : "Show"}
              </button>
            </div>

            {showHistory && (
              <div
                className="space-y-3 mt-4 border-t pt-4 pr-2 custom-scrollbar"
                style={{
                  maxHeight: "60vh",
                  overflowY: "auto",
                  overscrollBehavior: "contain",
                }}
              >
                {historicalEvents.length === 0 ? (
                  <p className="text-gray-500 italic text-xs text-center py-4">
                    No history.
                  </p>
                ) : (
                  historicalEvents.map((event: any, i) => (
                    <EventItem key={event.id || i} event={event} />
                  ))
                )}
              </div>
            )}
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
  // Truncate Stellar addresses (G... or C...) in text
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
      className={`border-l-4 ${isLive ? "border-red-500 bg-red-50" : "border-gray-300 bg-gray-50"} pl-4 py-2 rounded-r-md transition-all mb-2`}
    >
      <div className="flex justify-between items-start">
        <span
          className={`font-bold uppercase text-[10px] tracking-wider ${isLive ? "text-red-700" : "text-gray-600"}`}
        >
          {event.type}
        </span>
        <span className="text-[10px] text-gray-500 font-mono">
          #{event.ledger}
        </span>
      </div>
      <p className="text-sm text-gray-800 font-medium leading-tight my-1 break-all">
        {formatDetails(event.details)}
      </p>
      <p className="text-[10px] text-gray-400 font-mono" title={event.hash}>
        TX: {truncateId(event.hash, 8, 8)}
      </p>
    </div>
  );
}

function StatCard({ title, value, highlight = false }) {
  return (
    <div
      className={`bg-white px-3 py-1.5 rounded-md shadow-sm border ${highlight ? "border-blue-500 bg-blue-50" : "border-gray-200"} flex items-center justify-between`}
    >
      <span className="text-[10px] text-gray-500 uppercase tracking-tighter font-bold">
        {title}
      </span>
      <span className="text-sm font-bold text-gray-900">{value}</span>
    </div>
  );
}
