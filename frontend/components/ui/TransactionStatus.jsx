import React from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function TransactionStatus({ status, hash, error }) {
  if (status === "pending") {
    return (
      <div className="flex items-center gap-2 text-blue-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Transaction pending...</span>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">
          Transaction successful!
          {hash && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-600 hover:underline"
            >
              View on Explorer
            </a>
          )}
        </span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <XCircle className="w-4 h-4" />
        <span className="text-sm">Error: {error}</span>
      </div>
    );
  }

  return null;
}
