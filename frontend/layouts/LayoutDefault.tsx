import React, { useEffect } from "react";
import { Link } from "../components/Link";
import MobileNav from "../components/ui/MobileNav";
import ThemeToggle from "../components/ThemeToggle";
import StellarSdk from "@stellar/stellar-sdk";
import logoUrl from "../assets/logo.png";
import {
  setSponsorKeypair,
  checkSponsorBalance,
  fundSponsorAccount,
} from "../src/utils/stellar";

export default function LayoutDefault({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const initSponsor = async () => {
      const sponsorSecret = import.meta.env.VITE_SPONSOR_SECRET;
      if (sponsorSecret && sponsorSecret !== "") {
        try {
          const sponsorKeypair = StellarSdk.Keypair.fromSecret(sponsorSecret);
          setSponsorKeypair(sponsorKeypair);

          let balance = await checkSponsorBalance();

          // Auto-fund if needed
          if (balance && (!balance.exists || !balance.sufficient)) {
            const funded = await fundSponsorAccount();
            if (funded) {
              balance = await checkSponsorBalance();
            }
          }

          if (balance && !balance.exists) {
            console.warn(`⚠️ Sponsor account not funded!`);
          } else if (balance && !balance.sufficient) {
            console.warn(
              `⚠️ Sponsor balance low: ${balance.balance} XLM. Need at least 10 XLM for gasless transactions.`,
            );
          }
        } catch (error) {
          console.error("Failed to initialize sponsor:", error);
        }
      } else {
        console.warn(
          "⚠️ VITE_SPONSOR_SECRET not set - transactions will not be sponsored",
        );
      }
    };

    initSponsor();
  }, []);
  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <img
                  src={logoUrl}
                  alt="TrustVault"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col -gap-1">
                <span className="text-xl font-bold text-on-surface tracking-tight leading-none">
                  TrustVault
                </span>
                <span className="text-[10px] text-teal-600 font-bold tracking-widest uppercase mt-0.5">
                  Professional Escrow
                </span>
              </div>
            </Link>

            <div className="hidden md:flex space-x-8 items-center">
              <Link
                href="/"
                className="text-sm font-medium text-on-surface-variant hover:text-teal-600 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-on-surface-variant hover:text-teal-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/create"
                className="text-sm font-medium text-on-surface-variant hover:text-teal-600 transition-colors"
              >
                Create Vault
              </Link>
              <Link
                href="/metrics"
                className="text-sm font-medium text-on-surface-variant hover:text-teal-600 transition-colors"
              >
                Metrics
              </Link>
              <div className="h-6 w-px bg-outline-variant mx-2"></div>

              <div className="flex items-center gap-4">
                <ThemeToggle />
                <button className="bg-primary-container text-white px-5 py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm">
                  Connect Wallet
                </button>
              </div>
            </div>

            <div className="flex md:hidden items-center gap-4">
              <ThemeToggle />
              <MobileNav />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="w-full py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto border-t border-outline-variant mt-12 bg-surface">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="text-md font-bold text-on-surface">TrustVault</div>
          <p className="text-xs text-on-surface-variant">
            © 2024 TrustVault. Institutional Grade Escrow on Stellar.
          </p>
        </div>
        <div className="flex gap-6">
          <a
            className="text-xs text-on-surface-variant hover:text-on-surface underline decoration-teal-500/30 transition-colors"
            href="#"
          >
            Documentation
          </a>
          <a
            className="text-xs text-on-surface-variant hover:text-on-surface underline decoration-teal-500/30 transition-colors"
            href="#"
          >
            Privacy Policy
          </a>
          <a
            className="text-xs text-on-surface-variant hover:text-on-surface underline decoration-teal-500/30 transition-colors"
            href="#"
          >
            Security Audit
          </a>
        </div>
      </footer>
    </div>
  );
}
