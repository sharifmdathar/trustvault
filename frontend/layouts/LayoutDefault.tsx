import React from "react";
import { Link } from "../components/Link";
import MobileNav from "../components/ui/MobileNav";

export default function LayoutDefault({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <main>{children}</main>
    </div>
  );
}