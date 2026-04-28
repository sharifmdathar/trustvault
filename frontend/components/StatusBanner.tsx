import React, { useEffect } from "react";

type NotifType = "success" | "error" | "warning" | "info";

interface Action {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

interface StatusBannerProps {
  type: NotifType;
  message: string;
  onDismiss: () => void;
  actions?: Action[];
  /** Auto-dismiss delay in ms. Set to 0 to disable. Default: 4000. Ignored when `actions` are present. */
  autoDismiss?: number;
}

const TYPE_CFG: Record<NotifType, { icon: string; statusKey: string }> = {
  success: { icon: "check_circle", statusKey: "confirmed" },
  error: { icon: "error", statusKey: "disputed" },
  warning: { icon: "warning", statusKey: "pending" },
  info: { icon: "info", statusKey: "active" },
};

export default function StatusBanner({
  type,
  message,
  onDismiss,
  actions,
  autoDismiss = 4000,
}: StatusBannerProps) {
  const { icon, statusKey } = TYPE_CFG[type];
  const bg = `var(--status-${statusKey}-bg)`;
  const text = `var(--status-${statusKey}-text)`;
  const border = `var(--status-${statusKey}-border)`;

  useEffect(() => {
    if (!actions?.length && autoDismiss > 0) {
      const timer = setTimeout(onDismiss, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss, actions]);

  return (
    <div
      role="alert"
      style={{ backgroundColor: bg, color: text, borderColor: border }}
      className="flex items-start gap-3 p-4 rounded-xl border mb-4"
    >
      <span
        className="material-symbols-outlined text-xl"
        style={{ flexShrink: 0 }}
        aria-hidden="true"
      >
        {icon}
      </span>

      <div className="flex-1">
        <p className="text-sm font-semibold">{message}</p>
        {actions && actions.length > 0 && (
          <div className="flex gap-2 mt-3">
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                style={
                  action.primary
                    ? { backgroundColor: text, color: bg, border: "none" }
                    : {
                        backgroundColor: "transparent",
                        color: text,
                        border: `1px solid ${text}`,
                      }
                }
                className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!actions?.length && (
        <button
          onClick={onDismiss}
          style={{ color: text, flexShrink: 0 }}
          className="opacity-60 hover:opacity-100 transition-all"
          aria-label="Dismiss notification"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      )}
    </div>
  );
}
