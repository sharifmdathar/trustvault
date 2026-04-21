import React, { useState, useEffect } from "react";
import VaultCard from "../../components/VaultCard";
import ConnectWallet from "../../components/ConnectWallet";
import { Vault } from "../../types";
import {
  getUserVaults,
  confirmVault,
  flagDispute,
} from "../../src/utils/stellar.js";

export default function Page() {
  const [address, setAddress] = useState<string>("");
  const [buyerVaults, setBuyerVaults] = useState<Vault[]>([]);
  const [sellerVaults, setSellerVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      loadVaults();
    }
  }, [address]);

  const loadVaults = async () => {
    setLoading(true);
    try {
      const vaults = await getUserVaults(address);
      setBuyerVaults(vaults.filter((v) => v.buyer === address));
      setSellerVaults(vaults.filter((v) => v.seller === address));
    } catch (error) {
      console.error("Error loading vaults:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (vaultId: string) => {
    try {
      await confirmVault(vaultId, address);
      await loadVaults();
      alert("Vault confirmed! Funds released to seller.");
    } catch (error) {
      console.error("Error confirming vault:", error);
      alert("Failed to confirm vault. Please try again.");
    }
  };

  const handleDispute = async (vaultId: string) => {
    const confirmed = confirm(
      "Are you sure you want to dispute this transaction?",
    );
    if (!confirmed) return;

    try {
      await flagDispute(vaultId, address);
      await loadVaults();
      alert("Dispute filed! Arbitration process started.");
    } catch (error) {
      console.error("Error filing dispute:", error);
      alert("Failed to file dispute. Please try again.");
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
          <p className="text-gray-600 mb-6">
            Connect your wallet to view your vaults
          </p>
          <ConnectWallet onConnect={setAddress} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="text-sm text-gray-600">
            Connected: {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading vaults...</div>
        ) : (
          <>
            {/* Buyer Vaults */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">As Buyer</h2>
              {buyerVaults.length === 0 ? (
                <p className="text-gray-500">No vaults as buyer yet</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {buyerVaults.map((vault) => (
                    <VaultCard
                      key={vault.id}
                      vault={vault}
                      role="buyer"
                      onConfirm={handleConfirm}
                      onDispute={handleDispute}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Seller Vaults */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">As Seller</h2>
              {sellerVaults.length === 0 ? (
                <p className="text-gray-500">No vaults as seller yet</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sellerVaults.map((vault) => (
                    <VaultCard
                      key={vault.id}
                      vault={vault}
                      role="seller"
                      onDispute={handleDispute}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
