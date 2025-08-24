import React from "react";
import { useCrypto } from "../context/CryptoContext";

/**
 * 3-block PriceDisplay (stable height, no flicker)
 * - left / middle / right blocks (right = decimal)
 * - when integer < 1000 we show a small placeholder in the middle block so nothing is empty
 * - loader covers the whole block and cross-fades into the price
 */
export default function PriceDisplay() {
  const { currentPrice, selectedCrypto, isLoading } = useCrypto();

  const TRANS_MS = 360;

  const splitPrice = (n?: number | null) => {
    if (n == null || !isFinite(n)) return { left: "", middle: "", right: "" };
    const s = n.toFixed(2);
    const [intPart, decPart = "00"] = s.split(".");
    if (intPart.length > 3) {
      return {
        left: intPart.slice(0, -3),
        middle: intPart.slice(-3),
        right: `.${decPart}`,
      };
    }
    // integer <= 3 digits: show integer in middle block, keep left placeholder
    return { left: "", middle: intPart, right: `.${decPart}` };
  };

  const parts = splitPrice(currentPrice);

  // Helper: show placeholder dot when left is empty (keeps three-block visual)
  const MiddleVisual = ({ text }: { text: string }) => {
    if (text) {
      return <div style={{ fontSize: 72, fontWeight: 800 }}>{text}</div>;
    }
    return (
      <div
        aria-hidden
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          background: "rgba(255,255,255,0.2)",
        }}
      />
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
        {/* Loader overlay */}
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
          <div
            className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse"
            style={{ backgroundSize: "200% 100%" }}
          />
          <div
            style={{
              height: 140,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "0 32px",
              zIndex: 2,
              position: "relative",
            }}
          >
            <div style={{ flex: 1, height: 92, borderRadius: 20, background: "rgba(255,255,255,0.06)" }} />
            <div style={{ flex: 0.7, height: 92, borderRadius: 20, background: "rgba(255,255,255,0.06)" }} />
            <div style={{ flex: 0.45, height: 92, borderRadius: 20, background: "rgba(255,255,255,0.06)" }} />
          </div>
        </div>

        {/* Price content (cross-fades in) */}
        <div
          aria-hidden={isLoading}
          className="absolute inset-0 flex items-center justify-center rounded-2xl"
          style={{
            transition: `opacity ${TRANS_MS}ms ease, transform ${TRANS_MS}ms ease`,
            opacity: isLoading ? 0 : 1,
            transform: isLoading ? "translateY(6px)" : "translateY(0)",
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
            {/* Left block */}
            <div
              style={{
                flex: 1,
                minHeight: 92,
                borderRadius: 20,
                background: "var(--card-bg, rgba(255,255,255,0.04))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text, #fff)",
              }}
            >
              {parts.left ? (
                <div style={{ fontSize: 72, fontWeight: 800 }}>{parts.left}</div>
              ) : (
                // if no left int, show the middle (so left isn't empty) but smaller
                <div style={{ fontSize: 56, fontWeight: 800 }}>{parts.middle}</div>
              )}
            </div>

            {/* Middle block */}
            <div
              style={{
                flex: 0.7,
                minHeight: 92,
                borderRadius: 20,
                background: "var(--card-bg, rgba(255,255,255,0.02))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text, #fff)",
              }}
            >
              {/* If left was empty we already showed the integer on left; render placeholder OR last3 */}
              {parts.left ? (
                <div style={{ fontSize: 72, fontWeight: 800 }}>{parts.middle}</div>
              ) : (
                <MiddleVisual text={""} />
              )}
            </div>

            {/* Right (decimal) block */}
            <div
              style={{
                flex: 0.45,
                minHeight: 92,
                borderRadius: 20,
                background: "var(--accent-bg, rgba(255,255,255,0.02))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text, #fff)",
              }}
            >
              <div style={{ fontSize: 56, fontWeight: 800, opacity: 0.95 }}>{parts.right}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}