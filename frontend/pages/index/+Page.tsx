import React from 'react';
import { Link } from '../../components/Link';
import ConnectWallet from '../../components/ConnectWallet';
import RecentTransactions from '../../components/RecentTransactions';
import { Shield, Clock, Scale } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              TrustVault
              <span className="block text-3xl text-blue-600 mt-2">
                Secure Escrow on Stellar
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Decentralized escrow service protecting both buyers and sellers 
              with multi-signature security and arbitration.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/create"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Vault
              </Link>
              <ConnectWallet className="px-8 py-3" />
            </div>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How TrustVault Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Create Vault</h3>
              <p className="text-gray-600">
                Buyer creates a vault, specifying seller, amount, and terms
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Fund & Deliver</h3>
              <p className="text-gray-600">
                Buyer deposits funds, seller delivers goods/service
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Scale className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Release or Arbitrate</h3>
              <p className="text-gray-600">
                Buyer confirms delivery or dispute goes to arbitration
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RecentTransactions />
        </div>
      </div>
    </div>
  );
}
