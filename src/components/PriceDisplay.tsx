import React from "react";
import { useCrypto } from "../context/CryptoContext";

/**
 * PriceDisplay
 * - shows a stable-height loader when context.isLoading === true
 * - otherwise fades into the formatted price
 *
 * Uses Tailwind classes where available; inline styles keep height stable to avoid flicker.
 */
export default function PriceDisplay() {
  const { currentPrice, selectedCrypto, isLoading } = useCrypto();

  const formatted = (n: number) => {
    if (!isFinite(n) || n <= 0) return "0.00";
    return n.toFixed(2);
  };

  const parts = formatted(currentPrice).split(".");

  return (
    <div
      className="w-full max-w-[1100px] mx-auto"
      style={{ minHeight: 160, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div style={{ width: "100%", minHeight: 140 }}>
        {isLoading ? (
          // skeleton - stable height, shimmer/pulse
          <div
            aria-busy="true"
            aria-label="Loading price"
            className="rounded-2xl overflow-hidden relative bg-gray-100"
            style={{ minHeight: 140 }}
          >
            <div
              className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-[pulse_1.6s_infinite]"
              style={{ backgroundSize: "200% 100%" }}
            />
            <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, position: "relative" }}>
              <div style={{ width: "55%", height: 52, borderRadius: 12, background: "rgba(255,255,255,0.6)" }} />
            </div>
          </div>
        ) : (
          <div
            className="flex items-center justify-center rounded-2xl bg-white shadow-sm"
            style={{ minHeight: 140, transition: "opacity 320ms ease" }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1 }}>
                <span style={{ letterSpacing: "-0.02em" }}>{parts[0]}</span>
                <span style={{ fontSize: 52, opacity: 0.85 }}>.{parts[1]}</span>
              </div>
              <div style={{ marginTop: 8, color: "#6b7280", fontWeight: 600 }}>
                {selectedCrypto} / USDT
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}