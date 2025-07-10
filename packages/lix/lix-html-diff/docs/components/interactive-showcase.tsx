import { useRef, useEffect, useState } from "react";
import { renderHtmlDiff } from "../../src/render-html-diff";

interface HoverCard {
  x: number;
  y: number;
  diffKey: string;
  before: string;
  after: string;
}

export function InteractiveShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const [hoverCard, setHoverCard] = useState<HoverCard | null>(null);

  const beforeHtml = `
    <table class="pricing-table">
      <thead>
        <tr>
          <th></th>
          <th>Basic Plan</th>
          <th>Pro Plan</th>
          <th>Enterprise</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="row-header">Monthly Price</td>
          <td data-diff-key="basic-price">$9</td>
          <td data-diff-key="pro-price">$29</td>
          <td data-diff-key="enterprise-price">$99</td>
        </tr>
        <tr>
          <td class="row-header">Storage</td>
          <td data-diff-key="basic-storage">10GB</td>
          <td data-diff-key="pro-storage">100GB</td>
          <td data-diff-key="enterprise-storage">1TB</td>
        </tr>
        <tr>
          <td class="row-header">Users</td>
          <td data-diff-key="basic-users">1</td>
          <td data-diff-key="pro-users">5</td>
          <td data-diff-key="enterprise-users">Unlimited</td>
        </tr>
      </tbody>
    </table>
  `;

  const afterHtml = `
    <table class="pricing-table">
      <thead>
        <tr>
          <th></th>
          <th>Basic Plan</th>
          <th>Pro Plan</th>
          <th>Enterprise</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="row-header">Monthly Price</td>
          <td data-diff-key="basic-price">$12</td>
          <td data-diff-key="pro-price">$39</td>
          <td data-diff-key="enterprise-price">$99</td>
        </tr>
        <tr>
          <td class="row-header">Storage</td>
          <td data-diff-key="basic-storage">15GB</td>
          <td data-diff-key="pro-storage">250GB</td>
          <td data-diff-key="enterprise-storage">1TB</td>
        </tr>
        <tr>
          <td class="row-header">Users</td>
          <td data-diff-key="basic-users">1</td>
          <td data-diff-key="pro-users">10</td>
          <td data-diff-key="enterprise-users">Unlimited</td>
        </tr>
      </tbody>
    </table>
  `;

  const originalData = {
    "basic-price": { before: "$9", after: "$12" },
    "pro-price": { before: "$29", after: "$39" },
    "basic-storage": { before: "10GB", after: "15GB" },
    "pro-storage": { before: "100GB", after: "250GB" },
    "pro-users": { before: "5", after: "10" },
  };

  useEffect(() => {
    if (!ref.current) return;

    // Generate diff
    const diffResult = renderHtmlDiff({ beforeHtml, afterHtml });
    ref.current.innerHTML = diffResult;

    // Add event listeners to updated elements
    const updatedElements = ref.current.querySelectorAll(
      ".diff-updated[data-diff-key]",
    );

    const handleMouseEnter = (e: Event) => {
      const element = e.target as HTMLElement;
      const diffKey = element.getAttribute("data-diff-key");

      if (!diffKey || !originalData[diffKey as keyof typeof originalData]) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const data = originalData[diffKey as keyof typeof originalData];

      setHoverCard({
        x: rect.left,
        y: rect.bottom + 8,
        diffKey,
        before: data.before,
        after: data.after,
      });
    };

    const handleMouseLeave = () => {
      setHoverCard(null);
    };

    updatedElements.forEach((element) => {
      element.addEventListener("mouseenter", handleMouseEnter);
      element.addEventListener("mouseleave", handleMouseLeave);
    });

    return () => {
      updatedElements.forEach((element) => {
        element.removeEventListener("mouseenter", handleMouseEnter);
        element.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <style>{`
        .pricing-table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .pricing-table th, .pricing-table td {
          border: 1px solid #e5e7eb;
          padding: 12px 16px;
          text-align: left;
        }
        .pricing-table th {
          background-color: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        .pricing-table .row-header {
          background-color: #f3f4f6;
          font-weight: 500;
          color: #1f2937;
        }
        .diff-updated {
          color: #f59e0b;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        .diff-updated:hover {
          background-color: rgba(245, 158, 11, 0.1);
          transform: scale(1.02);
        }
      `}</style>

      <div
        ref={ref}
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1rem",
          backgroundColor: "#fafafa",
        }}
      />

      {hoverCard && (
        <div
          style={{
            position: "fixed",
            left: hoverCard.x,
            top: hoverCard.y,
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
            maxWidth: "300px",
            zIndex: 9999,
            fontSize: "14px",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#f9fafb",
              borderRadius: "8px 8px 0 0",
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: "10px",
                padding: "3px 8px",
                borderRadius: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                background: "#fef3c7",
                color: "#92400e",
              }}
            >
              UPDATED
            </span>
            <span
              style={{
                fontFamily: "Monaco, Menlo, monospace",
                fontSize: "11px",
                color: "#6b7280",
                background: "#f3f4f6",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              {hoverCard.diffKey}
            </span>
          </div>
          <div style={{ padding: "16px" }}>
            <div style={{ marginBottom: "12px" }}>
              <h4
                style={{
                  margin: "0 0 6px 0",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                BEFORE
              </h4>
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "4px",
                  padding: "8px 10px",
                  fontFamily: "Monaco, Menlo, monospace",
                  fontSize: "13px",
                  color: "#334155",
                  fontWeight: 500,
                }}
              >
                {hoverCard.before}
              </div>
            </div>
            <div>
              <h4
                style={{
                  margin: "0 0 6px 0",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                AFTER
              </h4>
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "4px",
                  padding: "8px 10px",
                  fontFamily: "Monaco, Menlo, monospace",
                  fontSize: "13px",
                  color: "#334155",
                  fontWeight: 500,
                }}
              >
                {hoverCard.after}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
