import React, { useState } from "react";
import { navigate } from "vike/client/router";
import LoadingSpinner from "../ui/LoadingSpinner";
import StatusBanner from "../StatusBanner";

export default function CreateVault({ onSubmit, buyerAddress }) {
  const [formData, setFormData] = useState({
    seller: "",
    amount: "",
    description: "",
    deadline: "7",
    arbitrator: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePreview = () => {
    const seller = formData.seller.trim();
    const arbitrator = formData.arbitrator.trim();
    const buyer = (buyerAddress || "").trim();
    if (seller && arbitrator && seller === arbitrator) {
      setFormError("Seller and arbitrator cannot be the same address.");
      return;
    }
    if (buyer && arbitrator && buyer === arbitrator) {
      setFormError("Buyer and arbitrator cannot be the same address.");
      return;
    }
    setFormError(null);
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const vaultId = await onSubmit(formData);
      if (vaultId) {
        navigate(`/vault/${vaultId}`);
      }
    } catch (error) {
      console.error("Error creating vault:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-3xl mx-auto">
      {!showPreview ? (
        <form
          className="bg-surface-high rounded-huge border border-outline-variant shadow-xl p-8 sm:p-12 space-y-8"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">
                add_box
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-on-surface">
                Vault Configuration
              </h2>
              <p className="text-sm text-on-surface-variant">
                Define the terms of your secure escrow agreement.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2 uppercase tracking-tight opacity-60">
                Seller Address *
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm opacity-40">
                  wallet
                </span>
                <input
                  type="text"
                  name="seller"
                  value={formData.seller}
                  onChange={handleInputChange}
                  placeholder="G..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-on-surface"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2 uppercase tracking-tight opacity-60">
                  Amount (XLM) *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    payments
                  </span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="100"
                    className="w-full pl-12 pr-4 py-4 bg-surface-low border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">
                  Deadline (days) *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    calendar_today
                  </span>
                  <input
                    type="number"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    min="1"
                    max="30"
                    className="w-full pl-12 pr-4 py-4 bg-surface-low border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2 uppercase tracking-tight opacity-60">
                  Arbitrator Address *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm opacity-40">
                    gavel
                  </span>
                  <input
                    type="text"
                    name="arbitrator"
                    value={formData.arbitrator}
                    onChange={handleInputChange}
                    placeholder="G..."
                    className="w-full pl-12 pr-4 py-4 bg-surface-low border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe the goods or services..."
                className="w-full px-4 py-4 bg-surface-low border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                required
              />
            </div>
          </div>
          {formError && (
            <StatusBanner
              type="error"
              message={formError}
              onDismiss={() => setFormError(null)}
              autoDismiss={0}
            />
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="button"
              onClick={handlePreview}
              disabled={
                !formData.seller || !formData.amount || !formData.description || !formData.arbitrator
              }
              className="flex-1 bg-primary text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
            >
              Preview Vault
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-8 py-4 bg-surface border border-outline-variant text-on-surface-variant rounded-xl font-bold text-lg hover:bg-surface-low transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-surface-high rounded-huge border border-outline-variant shadow-xl p-8 sm:p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
              <span className="material-symbols-outlined text-2xl">
                visibility
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-on-surface">
                Review & Confirm
              </h2>
              <p className="text-sm text-on-surface-variant opacity-60">
                Please verify the escrow details before deployment.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-10 bg-surface-low p-8 rounded-2xl border border-outline-variant">
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 tracking-wider opacity-60">
                Seller Address
              </p>
              <p className="font-mono text-sm break-all text-on-surface font-medium">
                {formData.seller}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 tracking-wider opacity-60">
                Arbitrator Address
              </p>
              <p className="font-mono text-sm break-all text-on-surface font-medium">
                {formData.arbitrator}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 tracking-wider opacity-60">
                  Locked Amount
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formData.amount} XLM
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 tracking-wider opacity-60">
                  Time Horizon
                </p>
                <p className="text-lg font-bold text-on-surface">
                  {formData.deadline} Days
                </p>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 tracking-wider opacity-60">
                Escrow Description
              </p>
              <p className="text-on-surface-variant leading-relaxed italic">
                {formData.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-primary text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
            >
              Confirm & Create
            </button>
            <button
              onClick={() => setShowPreview(false)}
              className="px-8 py-4 bg-surface-high border border-outline-variant text-on-surface-variant rounded-xl font-bold text-lg hover:bg-surface-low transition-all active:scale-[0.98]"
            >
              Edit Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
