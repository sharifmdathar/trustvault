import React from "react";
import { Zap } from "lucide-react";

export default function GaslessBanner() {
  return (
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
      <Zap className="w-5 h-5 text-green-600 flex-shrink-0" />
      <span className="text-green-700 text-sm font-medium">
        ⚡ Gasless Transaction — TrustVault pays your network fees!
      </span>
    </div>
  );
}