import { useEffect, useState } from "react";
import {
  getServer,
  requireContractId,
  ESCROW_ID,
  scValToNative,
} from "../utils/stellar";

export function useVaultEvents(vaultId) {
  const [liveEvents, setLiveEvents] = useState([]);
  const [historicalEvents, setHistoricalEvents] = useState([]);

  useEffect(() => {
    if (!ESCROW_ID) return;

    const rpcServer = getServer();
    let isSubscribed = true;
    let pollInterval;

    const fetchHistory = async () => {
      try {
        const latestLedger = await rpcServer.getLatestLedger();
        const startLedger = latestLedger.sequence - 10000;

        const response = await rpcServer.getEvents({
          startLedger: startLedger,
          filters: [{ type: "contract", contractIds: [ESCROW_ID] }],
        });

        if (isSubscribed && response.events) {
          const parsed = response.events
            .map(parseRpcEvent)
            .sort((a, b) => b.ledger - a.ledger);
          setHistoricalEvents(parsed);
        }
      } catch (e) {
        console.warn("History fetch error:", e);
      }
    };

    const pollEvents = async () => {
      try {
        const latestLedger = await rpcServer.getLatestLedger();
        const startLedger = latestLedger.sequence - 10;

        const response = await rpcServer.getEvents({
          startLedger: startLedger,
          filters: [{ type: "contract", contractIds: [ESCROW_ID] }],
        });

        if (isSubscribed && response.events && response.events.length > 0) {
          const parsed = response.events.map(parseRpcEvent);
          setLiveEvents((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const unique = parsed.filter((e) => !existingIds.has(e.id));
            if (unique.length === 0) return prev;
            return [...unique, ...prev].slice(0, 20);
          });
        }
      } catch (e) {
        console.warn("Polling error:", e);
      }
    };

    fetchHistory();
    pollInterval = setInterval(pollEvents, 5000);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, [vaultId]);

  return { liveEvents, historicalEvents };
}

function parseRpcEvent(event) {
  const topics = event.topic.map((t) => {
    try {
      return String(scValToNative(t));
    } catch (e) {
      return "";
    }
  });

  return {
    id: event.id,
    hash: event.txHash,
    timestamp: new Date().toISOString(),
    type: topics[0] || "event",
    details: topics.slice(1).join(" ") || "Contract action",
    ledger: event.ledger,
  };
}

function parseVaultEvent(tx, vaultId) {
  // Not used anymore with getEvents but kept for compatibility if needed
  return null;
}
