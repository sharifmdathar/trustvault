import React, { useState, useEffect } from "react";
import { connectWallet } from "../src/utils/stellar.js";
import StatusBanner from "./StatusBanner";

interface ConnectWalletProps {
  onConnect?: (address: string) => void;
  className?: string;
}

export default function ConnectWallet({
  onConnect,
  className = "",
}: ConnectWalletProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const savedAddress = localStorage.getItem("walletAddress");
        if (savedAddress) {
          setAddress(savedAddress);
          onConnect?.(savedAddress);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };
    checkConnection();
  }, [onConnect]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectError(null);
    try {
      const publicKey = await connectWallet();
      setAddress(publicKey);
      localStorage.setItem("walletAddress", publicKey);
      onConnect?.(publicKey);
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      const message = error.message || "Unknown error";
      setConnectError(
        `Failed to connect wallet: ${message}. Please ensure Freighter is installed and unlocked.`,
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAddress(null);
    localStorage.removeItem("walletAddress");
    onConnect?.("");
  };

  if (address) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-low border border-outline-variant rounded-lg">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-on-surface-variant font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs font-bold text-on-surface-variant hover:text-red-500 transition-colors uppercase tracking-tight opacity-60"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {connectError && (
        <StatusBanner
          type="error"
          message={connectError}
          onDismiss={() => setConnectError(null)}
        />
      )}
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
      >
        <div className="flex items-center justify-center gap-2">
          {isConnecting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              <span>Securing...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">
                account_balance_wallet
              </span>
              <span>Connect Wallet</span>
            </>
          )}
        </div>
      </button>
    </div>
  );
}
