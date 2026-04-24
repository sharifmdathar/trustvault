import React, { useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

const toastStyles = {
  success: "bg-green-50 border-green-500 text-green-800",
  error: "bg-red-50 border-red-500 text-red-800",
  info: "bg-blue-50 border-blue-500 text-blue-800",
  warning: "bg-yellow-50 border-yellow-500 text-yellow-800",
};

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: AlertCircle,
  warning: AlertCircle,
};

export default function TransactionToast({
  type,
  message,
  onClose,
  duration = 5000,
}) {
  const Icon = icons[type];
  const style = toastStyles[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center p-4 rounded-lg border-l-4 shadow-lg ${style}`}
    >
      <Icon className="w-5 h-5 mr-3" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-4">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
