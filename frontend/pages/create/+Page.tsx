import React, { useState } from "react";
import { navigate } from "vike/client/router";
import CreateVaultForm from "../../components/forms/CreateVault";
import { createVault, getWalletNetworkInfo } from "../../src/utils/stellar.js";
import ConnectWallet from "../../components/ConnectWallet";
import StatusBanner from "../../components/StatusBanner";

type NotifType = "success" | "error" | "warning" | "info";

export default function Page() {
  const [address, setAddress] = useState<string>("");
  const [walletNetwork, setWalletNetwork] = useState<{
    isMatch: boolean;
    walletNetwork: string;
    expectedNetwork: string;
  } | null>(null);
  const [notification, setNotification] = useState<{
    type: NotifType;
    message: string;
  } | null>(null);

  const checkWalletNetwork = async () => {
    const networkInfo = await getWalletNetworkInfo();
    const nextState = {
      isMatch: networkInfo.isMatch,
      walletNetwork: networkInfo.walletNetwork,
      expectedNetwork: networkInfo.expectedNetwork,
    };
    setWalletNetwork(nextState);
    return nextState;
  };

  const handleCreateVault = async (formData: any) => {
    if (!formData.seller || formData.seller === "") {
      setNotification({
        type: "warning",
        message: "Please enter a valid seller address.",
      });
      return;
    }
    const network = await checkWalletNetwork();
    if (!network.isMatch) {
      setNotification({
        type: "warning",
        message: `Wrong wallet network detected (${network.walletNetwork}). Switch Freighter to ${network.expectedNetwork} before creating a vault.`,
      });
      return;
    }
    const vaultId = await createVault(
      address,
      formData.seller,
      formData.amount,
      formData.description,
      parseInt(formData.deadline),
      formData.arbitrator,
    );
    return vaultId;
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-surface py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold mb-8 text-on-surface">Create New Vault</h1>
          <p className="text-on-surface-variant mb-6">
            Connect your wallet to create a vault
          </p>
          <ConnectWallet
            onConnect={async (nextAddress) => {
              setAddress(nextAddress);
              if (nextAddress) {
                await checkWalletNetwork();
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8 text-on-surface">Create New Vault</h1>
        {notification && (
          <StatusBanner
            type={notification.type}
            message={notification.message}
            onDismiss={() => setNotification(null)}
          />
        )}
        {walletNetwork && !walletNetwork.isMatch && (
          <StatusBanner
            type="warning"
            message={`Wallet network mismatch: ${walletNetwork.walletNetwork}. Switch to ${walletNetwork.expectedNetwork} before creating a vault.`}
            onDismiss={() => setWalletNetwork(null)}
            autoDismiss={0}
            actions={[
              {
                label: "Switch to Testnet Guide",
                onClick: () =>
                  window.open(
                    "https://docs.freighter.app/docs/guide/using-freighter#switching-networks",
                    "_blank",
                    "noopener,noreferrer",
                  ),
                primary: true,
              },
            ]}
          />
        )}
        <CreateVaultForm onSubmit={handleCreateVault} buyerAddress={address} />
      </div>
    </div>
  );
}
