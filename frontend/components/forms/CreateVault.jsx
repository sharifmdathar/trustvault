import React, { useState } from "react";
import { navigate } from "vike/client/router";
import LoadingSpinner from "../ui/LoadingSpinner";

export default function CreateVault({ onSubmit }) {
  const [formData, setFormData] = useState({
    seller: "",
    amount: "",
    description: "",
    deadline: "7",
  });
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
          className="bg-white rounded-huge border border-slate-100 shadow-xl p-8 sm:p-12 space-y-8"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
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
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">
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
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-900"
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
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-900"
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
                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-900"
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              disabled={
                !formData.seller || !formData.amount || !formData.description
              }
              className="flex-1 bg-teal-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
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
        <div className="bg-white rounded-huge border border-slate-100 shadow-xl p-8 sm:p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined text-2xl">
                visibility
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Review & Confirm
              </h2>
              <p className="text-sm text-slate-500">
                Please verify the escrow details before deployment.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-10 bg-slate-50 p-8 rounded-2xl border border-slate-100">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">
                Seller Address
              </p>
              <p className="font-mono text-sm break-all text-slate-900 font-medium">
                {formData.seller}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">
                  Locked Amount
                </p>
                <p className="text-2xl font-bold text-teal-600">
                  {formData.amount} XLM
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">
                  Time Horizon
                </p>
                <p className="text-lg font-bold text-slate-900">
                  {formData.deadline} Days
                </p>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">
                Escrow Description
              </p>
              <p className="text-slate-700 leading-relaxed">
                {formData.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-teal-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98]"
            >
              Confirm & Create
            </button>
            <button
              onClick={() => setShowPreview(false)}
              className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              Edit Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
