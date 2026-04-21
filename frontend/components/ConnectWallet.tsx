import React, { useState, useEffect } from 'react';
import { connectWallet } from '../src/utils/stellar.js';

interface ConnectWalletProps {
  onConnect?: (address: string) => void;
  className?: string;
}

export default function ConnectWallet({ onConnect, className = '' }: ConnectWalletProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const savedAddress = localStorage.getItem('walletAddress');
        if (savedAddress) {
          setAddress(savedAddress);
          onConnect?.(savedAddress);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };
    checkConnection();
  }, [onConnect]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const publicKey = await connectWallet();
      setAddress(publicKey);
      localStorage.setItem('walletAddress', publicKey);
      onConnect?.(publicKey);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please ensure Freighter is installed.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAddress(null);
    localStorage.removeItem('walletAddress');
    onConnect?.('');
  };

  if (address) {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <span className="text-sm text-gray-600">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
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
      className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 ${className}`}
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
