import React from "react";
import { useCrypto } from "../context/CryptoContext";

/**
 * Stable-height, theme-aware price block with minimum loader time and smooth cross-fade.
 * - loader always occupies the same container space as the price (no height flicker)
 * - cross-fade uses opacity transitions; pointer-events toggled for accessibility
 * - uses Tailwind utility classes if available; inline styles ensure consistent sizing
 */
export default function PriceDisplay() {
  const { currentPrice, selectedCrypto, isLoading } = useCrypto();

  const formatSafe = (n?: number | null) => {
    if (n == null || !isFinite(n) || n <= 0) return "0.00";
    return n.toFixed(2);
  };

  const priceStr = formatSafe(currentPrice);
  const [intPart, decPart = "00"] = priceStr.split(".");

  const TRANS_MS = 360;

  return (
    <div
      className="w-full max-w-[1100px] mx-auto"
      style={{
        minHeight: 160,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="relative w-full"
        style={{
          minHeight: 140,
          willChange: "opacity, transform",
          WebkitTransform: "translateZ(0)",
          transform: "translateZ(0)",
        }}
      >
        {/* Loader (on top while isLoading) */}
        <div
          aria-hidden={!isLoading}
          aria-busy={isLoading}
          role="status"
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            transition: `opacity ${TRANS_MS}ms ease`,
            opacity: isLoading ? 1 : 0,
            pointerEvents: isLoading ? "auto" : "none",
          }}
        >
          {/* skeleton background: adapts to dark mode if your app uses 'dark' class */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse"
            style={{ backgroundSize: "200% 100%" }}
          />
          <div
            style={{
              height: 140,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
              position: "relative",
            }}
          >
            <div
              style={{
                width: "55%",
                height: 56,
                borderRadius: 14,
                background: "rgba(255,255,255,0.28)",
              }}
              className="dark:opacity-80"
            />
          </div>
        </div>

        {/* Price view (below loader; fades in when ready) */}
        <div
          aria-hidden={isLoading}
          className="absolute inset-0 flex items-center justify-center rounded-2xl"
          style={{
            transition: `opacity ${TRANS_MS}ms ease, transform ${TRANS_MS}ms ease`,
            opacity: isLoading ? 0 : 1,
            transform: isLoading ? "translateY(6px)" : "translateY(0)",
            background: "var(--card-bg, #ffffff)",
            boxShadow: "var(--card-shadow, 0 6px 18px rgba(0,0,0,0.06))",
            pointerEvents: isLoading ? "none" : "auto",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1 }}>
              <span style={{ letterSpacing: "-0.02em" }}>{intPart}</span>
              <span style={{ fontSize: 52, opacity: 0.9 }}>.{decPart}</span>
            </div>
            <div style={{ marginTop: 8, color: "#6b7280", fontWeight: 600 }}>
              {selectedCrypto} / USDT
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}