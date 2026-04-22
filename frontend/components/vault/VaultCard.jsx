import React from 'react';
import { Link } from '../Link';
import StatusBadge from '../ui/StatusBadge';

export default function VaultCard({ vault, role, onConfirm, onDispute }) {
  const isBuyer = role === 'buyer';
  const counterparty = isBuyer ? vault.seller : vault.buyer;
  const canConfirm = isBuyer && vault.status === 'funded';
  const canDispute = vault.status === 'funded';

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Vault #{vault.id?.slice(0, 8)}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {isBuyer ? 'Seller' : 'Buyer'}: {counterparty?.slice(0, 6)}...{counterparty?.slice(-4)}
          </p>
        </div>
        <StatusBadge status={vault.status} />
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-2xl font-bold text-gray-900">{vault.amount} XLM</p>
        <p className="text-sm text-gray-600 line-clamp-2">{vault.description}</p>
        <div className="flex flex-col sm:flex-row justify-between text-sm text-gray-500 gap-2">
          <span>Created: {new Date(vault.createdAt).toLocaleDateString()}</span>
          <span>Deadline: {new Date(vault.deadline).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/vault/${vault.id}`}
          className="flex-1 text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          style={{ minHeight: '44px' }}
        >
          View Details
        </Link>
        {canConfirm && onConfirm && (
          <button
            onClick={() => onConfirm(vault.id)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            style={{ minHeight: '44px' }}
          >
            Confirm Delivery
          </button>
        )}
        {canDispute && onDispute && (
          <button
            onClick={() => onDispute(vault.id)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            style={{ minHeight: '44px' }}
          >
            Dispute
          </button>
        )}
      </div>
    </div>
  );
}