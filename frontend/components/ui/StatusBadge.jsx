import React from "react";

const statusColors = {
  pending: "badge-pending",
  active: "badge-active",
  funded: "badge-active",
  confirmed: "badge-confirmed",
  disputed: "badge-disputed",
  resolved: "badge-confirmed",
  cancelled: "badge-cancelled",
  expired: "badge-cancelled",
};

const statusLabels = {
  pending: "Pending",
  active: "Active",
  funded: "Active",
  confirmed: "Confirmed",
  disputed: "Disputed",
  resolved: "Resolved",
  cancelled: "Cancelled",
  expired: "Expired",
};

export default function StatusBadge({ status, className = "" }) {
  const normalizedStatus = status?.toLowerCase();
  const colorClass = statusColors[normalizedStatus] || statusColors.pending;
  const label = statusLabels[normalizedStatus] || status;

  return (
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full ${colorClass} ${className}`}
    >
      {label}
    </span>
  );
}
