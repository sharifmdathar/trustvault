import React from "react";
import { Link } from "../components/Link";

export default function LayoutDefault({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <Link
                href="/"
                className="flex items-center text-gray-900 hover:text-blue-600"
              >
                TrustVault
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-blue-600"
              >
                Dashboard
              </Link>
              <Link
                href="/create"
                className="flex items-center text-gray-600 hover:text-blue-600"
              >
                Create Vault
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
