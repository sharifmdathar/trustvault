import React, { useState } from 'react';
import StatusBadge from '../ui/StatusBadge';
import LoadingSpinner from '../ui/LoadingSpinner';
import CopyableAddress from '../ui/CopyableAddress';
import DisputePanel from './DisputePanel';

export default function VaultDetail({ vault, address, onDeposit, onConfirm, onDispute, onArbitrationVote, loading }) {
  const [actionLoading, setActionLoading] = useState(false);

  const isBuyer = address === vault?.buyer;
  const isSeller = address === vault?.seller;
  const canDeposit = vault?.status === 'pending' && isBuyer;
  const canConfirm = vault?.status === 'funded' && isBuyer;
  const canDispute = vault?.status === 'funded';

  const handleAction = async (action, handler) => {
    setActionLoading(true);
    try {
      await handler();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Vault #{vault?.id?.slice(0, 8)}
          </h1>
          <p className="text-gray-500 mt-1">
            Created {new Date(vault?.createdAt).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={vault?.status} />
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-500">Amount</label>
            <p className="text-3xl font-bold text-gray-900">{vault?.amount} XLM</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Deadline</label>
            <p className="text-gray-900">{new Date(vault?.deadline).toLocaleDateString()}</p>
          </div>
          <CopyableAddress address={vault?.buyer} label="Buyer" startChars={8} endChars={6} />
          <CopyableAddress address={vault?.seller} label="Seller" startChars={8} endChars={6} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">Description</h2>
        <p className="text-gray-700">{vault?.description}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Timeline</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm shrink-0">1</div>
            <div className="ml-4 flex-1">
              <p className="font-medium">Vault Created</p>
              <p className="text-sm text-gray-500">{new Date(vault?.createdAt).toLocaleString()}</p>
            </div>
          </div>
          {vault?.status !== 'pending' && (
            <div className="flex items-start">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm shrink-0">2</div>
              <div className="ml-4 flex-1">
                <p className="font-medium">Funds Deposited</p>
                <p className="text-sm text-gray-500">Buyer deposited {vault?.amount} XLM</p>
              </div>
            </div>
          )}
          {vault?.status === 'confirmed' && (
            <div className="flex items-start">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm shrink-0">3</div>
              <div className="ml-4 flex-1">
                <p className="font-medium">Transaction Completed</p>
                <p className="text-sm text-gray-500">Funds released to seller</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {(canDeposit || canConfirm || canDispute) && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-3">
            {canDeposit && (
              <button
                onClick={() => handleAction('deposit', onDeposit)}
                disabled={actionLoading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                style={{ minHeight: '44px' }}
              >
                {actionLoading ? <LoadingSpinner size="sm" /> : `Deposit ${vault?.amount} XLM`}
              </button>
            )}
            {canConfirm && (
              <button
                onClick={() => handleAction('confirm', onConfirm)}
                disabled={actionLoading}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                style={{ minHeight: '44px' }}
              >
                {actionLoading ? <LoadingSpinner size="sm" /> : 'Confirm Delivery & Release Funds'}
              </button>
            )}
            {canDispute && (
              <button
                onClick={() => handleAction('dispute', onDispute)}
                disabled={actionLoading}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                style={{ minHeight: '44px' }}
              >
                {actionLoading ? <LoadingSpinner size="sm" /> : 'File Dispute'}
              </button>
            )}
          </div>
        </div>
      )}

      {vault?.status === 'disputed' && vault?.arbitration && (
        <DisputePanel
          arbitration={vault.arbitration}
          onVote={onArbitrationVote}
          isArbitrator={vault.arbitration?.arbitrators?.includes(address)}
          loading={loading}
        />
      )}
    </div>
  );
}