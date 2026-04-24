import React, { useState, useEffect } from "react";
import { connectWallet } from "../src/utils/stellar.js";

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
    try {
      const publicKey = await connectWallet();
      setAddress(publicKey);
      localStorage.setItem("walletAddress", publicKey);
      onConnect?.(publicKey);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect wallet. Please ensure Freighter is installed.");
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
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-slate-600 font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-tight"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className={`px-8 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none ${className}`}
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
  );
}
