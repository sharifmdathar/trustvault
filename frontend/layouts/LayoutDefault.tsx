import React, { useEffect } from "react";
import { Link } from "../components/Link";
import MobileNav from "../components/ui/MobileNav";
import GaslessBanner from "../components/ui/GaslessBanner";
import StellarSdk from "@stellar/stellar-sdk";
import { setSponsorKeypair, checkSponsorBalance, fundSponsorAccount } from "../src/utils/stellar";

export default function LayoutDefault({
  children,
}: {
  children: React.ReactNode;
}) {
useEffect(() => {
    const initSponsor = async () => {
      const sponsorSecret = import.meta.env.VITE_SPONSOR_SECRET;
      if (sponsorSecret && sponsorSecret !== '') {
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
            console.warn(`⚠️ Sponsor balance low: ${balance.balance} XLM. Need at least 10 XLM for gasless transactions.`);
          }
        } catch (error) {
          console.error("Failed to initialize sponsor:", error);
        }
      } else {
        console.warn('⚠️ VITE_SPONSOR_SECRET not set - transactions will not be sponsored');
      }
    };
    
    initSponsor();
  }, []);
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-gray-900">
              TrustVault
            </Link>

            <div className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600">
                Dashboard
              </Link>
              <Link href="/create" className="text-gray-600 hover:text-blue-600">
                Create Vault
              </Link>
            </div>

            <MobileNav />
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <GaslessBanner />
      </div>
      <main>{children}</main>
    </div>
  );
}