import React from 'react';

const statusColors = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Active: 'bg-blue-100 text-blue-800',
  Funded: 'bg-blue-100 text-blue-800',
  Confirmed: 'bg-green-100 text-green-800',
  Disputed: 'bg-red-100 text-red-800',
  Resolved: 'bg-purple-100 text-purple-800',
  Cancelled: 'bg-gray-100 text-gray-800',
  Expired: 'bg-orange-100 text-orange-800',
};

export default function StatusBadge({ status, className = '' }) {
  const colorClass = statusColors[status] || statusColors.Pending;
  
  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${colorClass} ${className}`}>
      {status}
    </span>
  );
}