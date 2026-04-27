import React, { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyableAddress({
  address,
  label,
  startChars = 6,
  endChars = 4,
}) {
  const [copied, setCopied] = useState(false);
  const [truncatedAddress, setTruncatedAddress] = useState("");

  const truncateAddress = (addr, start, end) => {
    if (!addr) return "";
    if (addr.length <= start + end) return addr;
    return `${addr.slice(0, start)}...${addr.slice(-end)}`;
  };

  useEffect(() => {
    // Responsive truncation based on screen size
    const updateTruncation = () => {
      const isMobile = window.innerWidth < 640;
      const actualStart = isMobile ? 4 : startChars;
      const actualEnd = isMobile ? 4 : endChars;
      setTruncatedAddress(truncateAddress(address, actualStart, actualEnd));
    };

    updateTruncation();
    window.addEventListener("resize", updateTruncation);
    return () => window.removeEventListener("resize", updateTruncation);
  }, [address, startChars, endChars]);

  const handleCopy = async () => {
    if (typeof window === "undefined" || !navigator.clipboard) {
      console.error("Clipboard not available");
      return;
    }
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="w-full">
      <label className="text-sm text-on-surface-variant opacity-80">{label}</label>
      <div className="flex items-center gap-2 mt-1">
        <code className="text-sm bg-surface-low border border-outline-variant px-3 py-3 rounded-xl flex-1 break-all text-on-surface font-mono">
          {truncatedAddress}
        </code>
        <button
          onClick={handleCopy}
          className="p-3 bg-surface-low hover:bg-surface-high border border-outline-variant rounded-xl transition-all flex-shrink-0 active:scale-95"
          title="Copy full address"
        >
          {copied ? (
            <Check size={18} className="text-primary" />
          ) : (
            <Copy size={18} className="text-on-surface-variant" />
          )}
        </button>
      </div>
    </div>
  );
}
