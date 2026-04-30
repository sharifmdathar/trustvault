import React from "react";
import { Link } from "../../components/Link";
import ConnectWallet from "../../components/ConnectWallet";
import RecentTransactions from "../../components/RecentTransactions";
import { Shield, Clock, Scale } from "lucide-react";

export default function HomePage() {
  return (
    <div className="bg-surface text-on-surface antialiased animate-fade-in-up">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="z-10">
            <span className="inline-block py-2 px-4 bg-teal-50 text-teal-600 text-[10px] font-bold rounded-full mb-10 uppercase tracking-widest border border-outline-variant shadow-sm">
              Powered by Stellar Network
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
              Enterprise-Ready{" "}
              <span className="text-teal-600">Secure Escrow</span>
            </h1>
            <p className="text-lg text-slate-500 mb-10 max-w-lg leading-relaxed">
              The gold standard for peer-to-peer transactions. Protect your
              capital with transparent, automated workflows and decentralized
              dispute resolution.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/create"
                className="bg-teal-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98] flex items-center gap-2"
              >
                Get Started
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </Link>
              <Link
                href="/dashboard"
                className="bg-white border border-slate-200 text-slate-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-[0.98]"
              >
                Launch Dashboard
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-teal-500/10 opacity-20 blur-[100px] rounded-full"></div>
            <div className="relative bg-white p-6 rounded-huge border border-slate-100 shadow-2xl">
              <div className="bg-slate-50 rounded-2xl p-8 aspect-video flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-teal-600">
                    <span className="material-symbols-outlined text-4xl">
                      shield
                    </span>
                  </div>
                  <p className="text-slate-400 font-mono text-xs">
                    Transaction Protected by TrustVault Protocol
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center text-teal-600">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified_user
                  </span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    Vault Secured
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    TX: 832...f91
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-50 py-20 border-y border-slate-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div>
            <h2 className="text-4xl font-bold text-slate-900 mb-1">Growing</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Ecosystem Volume
            </p>
          </div>
          <div>
            <h2 className="text-4xl font-bold text-slate-900 mb-1">Minimal</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Dispute Rate
            </p>
          </div>
          <div>
            <h2 className="text-4xl font-bold text-slate-900 mb-1">Stellar</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Network Backbone
            </p>
          </div>
          <div>
            <h2 className="text-4xl font-bold text-slate-900 mb-1">&lt;5s</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Avg. Finality Speed
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Transparent Workflow
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            A three-step security protocol designed to eliminate counterparty
            risk and ensure fulfillment of obligations.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <WorkflowCard
            step="01"
            icon="add_box"
            title="Create Vault"
            description="Define terms, milestones, and release conditions in a few clicks. Our smart contracts handle the complexity behind the scenes."
          />
          <WorkflowCard
            step="02"
            icon="account_balance_wallet"
            title="Fund & Deliver"
            description="Assets are locked on the Stellar network. The seller delivers the product or service while the funds are visible but immutable."
          />
          <WorkflowCard
            step="03"
            icon="lock_open"
            title="Secure Release"
            description="Once milestones are verified, funds are released instantly. In case of disagreement, our arbitration layer kicks in."
          />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white rounded-massive mx-4 mb-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5 flex flex-col justify-center">
              <h2 className="text-4xl font-bold mb-6 leading-tight">
                Built for Institutional Resilience
              </h2>
              <p className="text-slate-on-dark text-lg mb-8 leading-relaxed">
                TrustVault leverages the speed and low cost of the Stellar
                network with the safety and compliance of traditional finance.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-teal-400">
                    check_circle
                  </span>
                  <span className="font-bold">
                    Security-First Architecture
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-teal-400">
                    check_circle
                  </span>
                  <span className="font-bold">Multi-signature Controls</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-6">
              <FeatureItem
                icon="shield_lock"
                title="Secure Escrow"
                description="Non-custodial infrastructure where only your keys or the contract logic can move assets."
              />
              <FeatureItem
                icon="visibility"
                title="Transparency"
                description="Audit every step on-chain. Real-time notifications for both parties throughout the lifecycle."
              />
              <FeatureItem
                icon="gavel"
                title="Arbitration"
                description="Access to decentralized arbitration or trusted third-party mediators to settle conflicts fairly."
              />
              <FeatureItem
                icon="bolt"
                title="Low-Cost Transactions"
                description="Stellar's minimal network fees mean settlements cost fractions of a cent — no gas management required."
              />
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none"></div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center mb-20">
        <div className="bg-teal-600 rounded-gigantic p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 relative z-10 tracking-tight">
            Ready to secure your next transaction?
          </h2>
          <p className="text-teal-50 text-xl mb-12 max-w-xl mx-auto relative z-10 opacity-90">
            Built for high-stakes settlements on the Stellar network — fast,
            transparent, and fully on-chain.
          </p>
          <div className="flex flex-wrap justify-center gap-4 relative z-10">
            <Link
              href="/create"
              className="bg-white-static text-teal-600 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-teal-50-static transition-all shadow-xl active:scale-[0.98]"
            >
              Open Your First Vault
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function WorkflowCard({ step, icon, title, description }: { step: string; icon: string; title: string; description: string }) {
  return (
    <div className="group bg-white p-10 rounded-huge border border-slate-100 transition-all hover:shadow-2xl hover:-translate-y-1 shadow-sm">
      <div className="flex justify-between items-start mb-8">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
          <span className="material-symbols-outlined text-3xl">{icon}</span>
        </div>
        <span className="text-4xl font-black text-slate-50 group-hover:text-teal-50 transition-colors">
          {step}
        </span>
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-4">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white/5 border border-white/10 p-8 rounded-huge hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300">
      <span className="material-symbols-outlined text-teal-400 mb-4 text-3xl">
        {icon}
      </span>
      <h4 className="text-lg font-bold mb-2 text-white">{title}</h4>
      <p className="text-slate-on-dark text-sm leading-relaxed">{description}</p>
    </div>
  );
}
