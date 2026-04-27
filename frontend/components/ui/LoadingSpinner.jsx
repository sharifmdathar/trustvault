import React from "react";

export default function LoadingSpinner({ size = "md", fullScreen = false }) {
  const sizes = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const spinner = (
    <div className="flex justify-center items-center">
      <div
        className={`${sizes[size]} border-4 border-primary/20 border-t-primary rounded-full animate-spin`}
      />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-surface/80 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
