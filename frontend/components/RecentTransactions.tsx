import React, { useState, useEffect } from 'react';
import { getRecentTransactions } from '../src/utils/stellar.js';
import { Transaction } from '../types';
import { Link } from './Link';

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const txs = await getRecentTransactions();
      setTransactions(txs.slice(0, 10));
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading transactions...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Transactions</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No transactions yet</p>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {tx.type.toUpperCase()} -
                      <Link href={`/vault/${tx.vaultId}`} className="text-blue-600 hover:underline ml-1">
                        Vault #{tx.vaultId.slice(0, 8)}
                      </Link>
                    </p>
                    <p className="text-sm text-gray-500">
                      From: {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
                    </p>
                    {tx.amount && (
                      <p className="text-sm text-gray-500">
                        Amount: {tx.amount} XLM
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded ${tx.status === 'success' ? 'bg-green-100 text-green-800' :
                      tx.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
