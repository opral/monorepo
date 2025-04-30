import React from "react";
import { List, AlertTriangle, XCircle } from "lucide-react";

export type LogIndicatorProps = {
  errorCount?: number;
  warningCount?: number;
  otherCount?: number;
  /**
   * Called when a log indicator is clicked. Receives the log level: 'error', 'warning', or 'other'.
   */
  onClick?: (level: "error" | "warning" | "other") => void;
};

/**
 * Displays three Lucide icons: generic log, warning, error (X).
 * Each icon shows a small badge if count > 0. Compact horizontal layout.
 * Badge is minimalist: text only, no background, no border, no shadow.
 * Icons and badge numbers share the same color for each type.
 */
export function LogIndicator({
  errorCount = 0,
  warningCount = 0,
  otherCount = 0,
  onClick,
}: LogIndicatorProps) {
  const ICON_COLORS = {
    other: otherCount > 0 ? "#555" : "#bbb",
    warning: warningCount > 0 ? "#FF9800" : "#ddd",
    error: errorCount > 0 ? "#F44336" : "#eee",
  };

  const icons = [
    {
      key: "other",
      icon: <List size={16} color={ICON_COLORS.other} />,
      count: otherCount,
      color: ICON_COLORS.other,
    },
    {
      key: "warning",
      icon: <AlertTriangle size={16} color={ICON_COLORS.warning} />,
      count: warningCount,
      color: ICON_COLORS.warning,
    },
    {
      key: "error",
      icon: <XCircle size={16} color={ICON_COLORS.error} />,
      count: errorCount,
      color: ICON_COLORS.error,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        height: 20,
      }}
      data-testid="log-indicator"
    >
      {icons.map((item) => (
        <button
          key={item.key}
          className="btn btn-xs btn-ghost"
          tabIndex={-1}
          type="button"
          disabled={item.count === 0}
          style={{
            position: "relative",
            width: 20,
            height: 20,
            minWidth: 0,
            minHeight: 0,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "none",
          }}
          aria-label={item.key + " logs"}
          onClick={
            item.count > 0 && onClick
              ? (e) => {
                  e.stopPropagation();
                  onClick(item.key as "error" | "warning" | "other");
                }
              : undefined
          }
        >
          {item.icon}
          {item.count > 0 && (
            <span
              style={{
                position: "absolute",
                top: -7,
                right: -5,
                minWidth: 12,
                maxWidth: 18,
                height: 12,
                fontSize: 10,
                fontWeight: 700,
                padding: 0,
                lineHeight: 1.1,
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
                background: "none",
                color: item.color,
              }}
              title={String(item.count)}
            >
              {item.count > 99 ? "99+" : item.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
