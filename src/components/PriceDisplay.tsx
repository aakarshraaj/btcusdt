import React from "react";
import { useCrypto } from "../context/CryptoContext";

/**
 * 3-block PriceDisplay (stable height, no flicker)
 * - Always: left=placeholder or leading digits, middle=integer or last-3, right=decimal
 * - Ensures middle block is never empty (where main digits always display)
 * - Shows visible loader on coin switch with shimmer animation
 */
export default function PriceDisplay() {
  const { currentPrice, selectedCrypto, isLoading } = useCrypto();

  const TRANS_MS = 450; // increased for better visibility

  // Updated logic: always puts numbers in middle for SOL and small cryptos
  const splitPrice = (n?: number | null) => {
    if (n == null || !isFinite(n)) return { left: "", middle: "0", right: ".00" };

    const s = n.toFixed(2);
    const [intPart, decPart = "00"] = s.split(".");

    // SOL (small price): keep integer in MIDDLE block, left has placeholder
    if (intPart.length <= 3) {
      return { left: "", middle: intPart, right: `.${decPart}` };
    }

    // BTC/ETH (larger prices): traditional 3-block split with last 3 in middle
    return {
      left: intPart.slice(0, -3),
      middle: intPart.slice(-3),
      right: `.${decPart}`,
    };
  };

  const parts = splitPrice(currentPrice);

  // Always show placeholder in left for small numbers (like SOL)
  const LeftContent = () => {
    if (parts.left) {
      return <div style={{ fontSize: 72, fontWeight: 800 }}>{parts.left}</div>;
    }
    return (
      <div aria-hidden className="relative flex items-center justify-center">
        {/* Placeholder dot or circle for left block when empty */}
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 999,
            background: "rgba(255,255,255,0.14)",
          }}
        />
      </div>
    );
  };

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
          WebkitTransform: "translateZ(0)",
          transform: "translateZ(0)",
        }}
      >
        {/* Loader overlay - ENHANCED visibility */}
        <div
          aria-hidden={!isLoading}
          aria-busy={isLoading}
          role="status"
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            transition: `opacity ${TRANS_MS}ms ease-out`,
            opacity: isLoading ? 1 : 0,
            pointerEvents: isLoading ? "auto" : "none",
          }}
        >
          {/* Enhanced shimmer animation */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.05) 40%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.6s infinite linear",
            }}
          />
          <style jsx>{`
            @keyframes shimmer {
              0% {
                background-position: 0% 0;
              }
              100% {
                background-position: 200% 0;
              }
            }
          `}</style>

          <div
            style={{
              height: 140,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "0 32px",
              position: "relative",
              zIndex: 2,
            }}
          >
            <div
              style={{
                flex: 1,
                height: 92,
                borderRadius: 20,
                background: "rgba(255,255,255,0.08)",
              }}
            />
            <div
              style={{
                flex: 0.7,
                height: 92,
                borderRadius: 20,
                background: "rgba(255,255,255,0.08)",
              }}
            />
            <div
              style={{
                flex: 0.45,
                height: 92,
                borderRadius: 20,
                background: "rgba(255,255,255,0.08)",
              }}
            />
          </div>
        </div>

        {/* Price content */}
        <div
          aria-hidden={isLoading}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transition: `opacity ${TRANS_MS}ms ease-out, transform ${TRANS_MS}ms ease-out`,
            opacity: isLoading ? 0 : 1,
            transform: isLoading ? "translateY(8px)" : "translateY(0)",
            pointerEvents: isLoading ? "none" : "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              width: "100%",
              padding: "0 32px",
            }}
          >
            {/* Left block - now either shows leading digits OR placeholder (never empty) */}
            <div
              style={{
                flex: 1,
                minHeight: 92,
                borderRadius: 20,
                background: "var(--card-bg, #1a1a1a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text, #fff)",
              }}
            >
              <LeftContent />
            </div>

            {/* Middle block - ALWAYS shows integer (for SOL) or last-3 (for BTC/ETH) */}
            <div
              style={{
                flex: 0.7,
                minHeight: 92,
                borderRadius: 20,
                background: "var(--card-bg, #1a1a1a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text, #fff)",
              }}
            >
              <div style={{ fontSize: 72, fontWeight: 800 }}>{parts.middle}</div>
            </div>

            {/* Right block - decimal */}
            <div
              style={{
                flex: 0.45,
                minHeight: 92,
                borderRadius: 20,
                background: "var(--accent-bg, #8B0000)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text, #fff)",
              }}
            >
              <div style={{ fontSize: 56, fontWeight: 800, opacity: 0.95 }}>
                {parts.right}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}