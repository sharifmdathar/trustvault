import React from "react";

const statusColors = {
  Pending: "badge-pending",
  Active: "badge-active",
  Funded: "badge-active",
  Confirmed: "badge-confirmed",
  Disputed: "badge-disputed",
  Resolved: "badge-confirmed",
  Cancelled: "badge-cancelled",
  Expired: "badge-cancelled",
};

export default function StatusBadge({ status, className = "" }) {
  const colorClass = statusColors[status] || statusColors.Pending;

  return (
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full ${colorClass} ${className}`}
    >
      {status}
    </span>
  );
}
