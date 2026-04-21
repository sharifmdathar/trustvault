import React from 'react';

interface VaultStatusBadgeProps {
  status: string;
  className?: string;
}

export default function VaultStatusBadge({ status, className = '' }: VaultStatusBadgeProps) {
  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    funded: { label: 'Funded', color: 'bg-blue-100 text-blue-800' },
    confirmed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
    disputed: { label: 'Disputed', color: 'bg-red-100 text-red-800' },
    resolved: { label: 'Resolved', color: 'bg-purple-100 text-purple-800' },
    cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
    expired: { label: 'Expired', color: 'bg-orange-100 text-orange-800' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color} ${className}`}>
      {config.label}
    </span>
  );
}
