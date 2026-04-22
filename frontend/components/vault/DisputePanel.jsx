import React, { useState } from 'react';
import { Scale, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function DisputePanel({ arbitration, onVote, isArbitrator, loading }) {
  const [voting, setVoting] = useState(false);

  const handleVote = async (decision) => {
    if (voting) return;
    setVoting(true);
    try {
      await onVote(decision);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Scale className="w-5 h-5" />
        Arbitration Status
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <ThumbsUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Release to Buyer</p>
          <p className="text-2xl font-bold">{arbitration?.votesBuyer || 0}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <ThumbsDown className="w-6 h-6 text-red-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Release to Seller</p>
          <p className="text-2xl font-bold">{arbitration?.votesSeller || 0}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <Minus className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Split 50/50</p>
          <p className="text-2xl font-bold">{arbitration?.votesSplit || 0}</p>
        </div>
      </div>

      <p className="text-sm text-gray-500 text-center mb-4">
        Total Votes: {arbitration?.totalVotes || 0} / {arbitration?.arbitrators?.length || 0}
      </p>

      {isArbitrator && !arbitration?.resolved && (
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Cast Your Vote</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleVote('buyer')}
              disabled={voting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              style={{ minHeight: '44px' }}
            >
              {voting ? <LoadingSpinner size="sm" /> : 'Release to Buyer'}
            </button>
            <button
              onClick={() => handleVote('seller')}
              disabled={voting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              style={{ minHeight: '44px' }}
            >
              {voting ? <LoadingSpinner size="sm" /> : 'Release to Seller'}
            </button>
            <button
              onClick={() => handleVote('split')}
              disabled={voting}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              style={{ minHeight: '44px' }}
            >
              {voting ? <LoadingSpinner size="sm" /> : 'Split 50/50'}
            </button>
          </div>
        </div>
      )}

      {arbitration?.resolved && arbitration?.decision && (
        <div className="mt-4 p-4 bg-purple-50 rounded-lg">
          <p className="text-center font-semibold text-purple-900">
            Resolution: Funds will be released to {arbitration.decision}
          </p>
        </div>
      )}
    </div>
  );
}