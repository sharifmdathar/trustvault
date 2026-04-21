import React, { useState } from "react";
import { navigate } from "vike/client/router";
import ConnectWallet from "../../components/ConnectWallet";
import { createVault } from "../../src/utils/stellar.js";

export default function Page() {
  const [address, setAddress] = useState<string>("");
  const [formData, setFormData] = useState({
    seller: "",
    amount: "",
    description: "",
    deadline: "7",
  });
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      const vaultId = await createVault(
        address,
        formData.seller,
        formData.amount,
        formData.description,
        parseInt(formData.deadline),
      );
      navigate(`/vault/${vaultId}`);
    } catch (error) {
      console.error("Error creating vault:", error);
      alert("Failed to create vault. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold mb-8">Create New Vault</h1>
          <p className="text-gray-600 mb-6">
            Connect your wallet to create a vault
          </p>
          <ConnectWallet onConnect={setAddress} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Create New Vault</h1>

        {!showPreview ? (
          <form
            className="bg-white rounded-lg shadow-md p-6 space-y-6"
            onSubmit={(e) => e.preventDefault()}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seller Address *
              </label>
              <input
                type="text"
                name="seller"
                value={formData.seller}
                onChange={handleInputChange}
                placeholder="G..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (XLM) *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe the goods or services..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline (days) *
              </label>
              <input
                type="number"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                min="1"
                max="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Seller must deliver within this timeframe
              </p>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                disabled={
                  !formData.seller || !formData.amount || !formData.description
                }
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Preview Vault
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Preview Vault</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-gray-500">Seller</label>
                <p className="font-mono text-sm">{formData.seller}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Amount</label>
                <p className="text-2xl font-bold text-gray-900">
                  {formData.amount} XLM
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Description</label>
                <p className="text-gray-700">{formData.description}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Deadline</label>
                <p className="text-gray-700">{formData.deadline} days</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Creating..." : "Confirm & Create"}
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
