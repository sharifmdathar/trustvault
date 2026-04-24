import React, { useState } from "react";
import { Link } from "../Link";
import { Menu, X } from "lucide-react";

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/create", label: "Create Vault" },
    { href: "/metrics", label: "Metrics" },
  ];

  return (
    <div className="md:hidden relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl text-on-surface-variant hover:text-teal-600 focus:outline-none transition-colors bg-surface-low border border-outline-variant"
        style={{ minHeight: "44px", minWidth: "44px" }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 w-64 mt-3 bg-surface-low shadow-2xl rounded-2xl border border-outline-variant z-50 overflow-hidden backdrop-blur-lg">
          <div className="flex flex-col py-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="px-8 py-5 text-sm font-bold text-on-surface-variant hover:bg-surface-high hover:text-teal-600 transition-colors flex items-center justify-between group"
                style={{ minHeight: "44px" }}
              >
                {item.label}
                <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  chevron_right
                </span>
              </Link>
            ))}
            <div className="px-6 py-4 border-t border-outline-variant mt-2 bg-surface-high/50">
              <button className="w-full bg-teal-600 text-white px-4 py-4 rounded-xl font-bold text-sm shadow-lg shadow-teal-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">
                  account_balance_wallet
                </span>
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
