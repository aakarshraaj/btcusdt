import React, { useEffect } from "react";
import { useCrypto } from "../context/CryptoContext";
import { splitPriceParts } from "../utils/formatPrice";

/**
 * Enhanced PriceDisplay with accessibility and performance optimizations:
 * 1. Empty block with SOL - adapts UI to 2-block for small integers
 * 2. Forces visible loader when switching coins
 * 3. Accessible price announcements for screen readers
 * 4. Semantic HTML structure with proper roles
 */
export default function PriceDisplay() {
  const { currentPrice, selectedCrypto, isLoading } = useCrypto();
  
  // Minimal logging left for debug while reducing noise

  const TRANS_MS = 400;

  // Use shared util to split price parts safely
  const partsRaw = splitPriceParts(currentPrice ?? undefined)
  const parts = partsRaw.left ? { twoBlocks: false, left: partsRaw.left, middle: partsRaw.middle, right: partsRaw.right } : { twoBlocks: true, left: partsRaw.middle, right: partsRaw.right }

  // Announce price changes to screen readers
  useEffect(() => {
    if (currentPrice && !isLoading) {
      const announcement = `${selectedCrypto} price updated to $${currentPrice}`;
      const liveRegion = document.getElementById('price-live-region');
      if (liveRegion) {
        liveRegion.textContent = announcement;
      }
    }
  }, [currentPrice, selectedCrypto, isLoading]);

  return (
    <section 
      className="mx-auto relative"
      style={{ 
        minHeight: 180, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        // Make it more compact and content-hugging
        width: "fit-content",
        maxWidth: "90vw",
      }}
      role="main"
      aria-label={`${selectedCrypto} price display`}
    >
      {/* Live region for screen reader announcements */}
      <div 
        id="price-live-region"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
      
      {/* LOADER - renders on top with fade transition */}
      {isLoading && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center"
          style={{
            animation: "fadeIn 0.3s ease-out forwards"
          }}
          role="status"
          aria-label="Loading price data"
        >
          <div 
            className="flex items-center justify-center gap-4"
            style={{
              height: 140,
              borderRadius: 16
            }}
          >
            {parts.twoBlocks ? (
              // 2-block skeleton for SOL
              <>
                <div className="h-32 bg-gray-800 rounded-2xl animate-pulse" style={{ width: '200px' }} />
                <div className="h-32 bg-gray-800 rounded-2xl animate-pulse" style={{ width: '160px' }} />
              </>
            ) : (
              // 3-block skeleton for BTC/ETH
              <>
                <div className="h-32 bg-gray-800 rounded-2xl animate-pulse" style={{ width: '140px' }} />
                <div className="h-32 bg-gray-800 rounded-2xl animate-pulse" style={{ width: '140px' }} />
                <div className="h-32 bg-gray-800 rounded-2xl animate-pulse" style={{ width: '120px' }} />
              </>
            )}
          </div>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .animate-pulse {
              animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes pulse {
              0%, 100% { opacity: 0.8; }
              50% { opacity: 0.5; }
            }
          `}</style>
        </div>
      )}

      {/* PRICE DISPLAY - hides when loading */}
      <div 
        className={`flex items-center justify-center gap-4 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{ 
          transition: `opacity ${TRANS_MS}ms ease-out`,
          minHeight: 140
        }}
      >
        {parts.twoBlocks ? (
          // 2-block display for SOL (no empty block!)
          <>
            <div 
              className="flex items-center justify-center rounded-2xl"
              style={{ 
                width: '200px', // Fixed width instead of flex
                minHeight: 92, 
                background: '#1a1a1a'
              }}
            >
              <div style={{ fontSize: 72, fontWeight: 800, color: 'white' }}>
                {parts.left}
              </div>
            </div>
            <div 
              className="flex items-center justify-center rounded-2xl"
              style={{ 
                width: '160px', // Fixed width instead of flex
                minHeight: 92, 
                background: '#8B0000'
              }}
            >
              <div style={{ fontSize: 56, fontWeight: 800, color: 'white' }}>
                {parts.right}
              </div>
            </div>
          </>
        ) : (
          // 3-block display for BTC/ETH
          <>
            <div 
              className="flex items-center justify-center rounded-2xl"
              style={{ 
                width: '140px', // Fixed width instead of flex
                minHeight: 92, 
                background: '#1a1a1a'
              }}
            >
              <div style={{ fontSize: 72, fontWeight: 800, color: 'white' }}>
                {parts.left}
              </div>
            </div>
            <div 
              className="flex items-center justify-center rounded-2xl"
              style={{ 
                width: '140px', // Fixed width instead of flex
                minHeight: 92, 
                background: '#1a1a1a'
              }}
            >
              <div style={{ fontSize: 72, fontWeight: 800, color: 'white' }}>
                {parts.middle}
              </div>
            </div>
            <div 
              className="flex items-center justify-center rounded-2xl"
              style={{ 
                width: '120px', // Fixed width instead of flex
                minHeight: 92, 
                background: '#8B0000'
              }}
            >
              <div style={{ fontSize: 56, fontWeight: 800, color: 'white' }}>
                {parts.right}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Crypto label */}
      <div 
        className="absolute bottom-0 left-0 right-0 text-center text-gray-400 font-semibold"
        style={{ marginBottom: '-24px' }}
      >
        {selectedCrypto} / USDT
      </div>
    </section>
  );
}