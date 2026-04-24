import React from "react";

interface VaultStatusBadgeProps {
  status: string;
  className?: string;
}

export default function VaultStatusBadge({
  status,
  className = "",
}: VaultStatusBadgeProps) {
  const statusConfig = {
    pending: { label: "Pending", color: "badge-pending" },
    funded: { label: "Active", color: "badge-active" },
    confirmed: { label: "Confirmed", color: "badge-confirmed" },
    disputed: { label: "Disputed", color: "badge-disputed" },
    resolved: { label: "Resolved", color: "badge-confirmed" },
    cancelled: { label: "Cancelled", color: "badge-cancelled" },
    expired: { label: "Expired", color: "badge-cancelled" },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${config.color} ${className}`}
    >
      {config.label}
    </span>
  );
}
