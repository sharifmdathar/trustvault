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
      <label className="text-sm text-gray-500">{label}</label>
      <div className="flex items-center gap-2 mt-1">
        <code className="text-sm bg-gray-50 px-2 py-1 rounded flex-1 break-all">
          {truncatedAddress}
        </code>
        <button
          onClick={handleCopy}
          className="p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
          title="Copy full address"
          style={{ minWidth: "44px", minHeight: "44px" }}
        >
          {copied ? (
            <Check size={18} className="text-green-600" />
          ) : (
            <Copy size={18} className="text-gray-500" />
          )}
        </button>
      </div>
    </div>
  );
}
