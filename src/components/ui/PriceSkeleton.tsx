import React from "react";

interface PriceSkeletonProps {
  blocks?: number;
  className?: string;
}

export const PriceSkeleton: React.FC<PriceSkeletonProps> = ({ 
  blocks = 3, 
  className = "" 
}) => {
  // Match the new compact PriceDisplay design
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      {Array.from({ length: blocks }).map((_, i) => {
        // Use fixed widths to match PriceDisplay component
        let width;
        if (blocks === 2) {
          // 2-block layout for SOL
          width = i === 0 ? '200px' : '160px';
        } else {
          // 3-block layout for BTC/ETH
          width = i === blocks - 1 ? '120px' : '140px';
        }
        
        return (
          <div 
            key={i} 
            className="rounded-2xl bg-muted/70 animate-pulse"
            style={{
              height: "92px", // Match PriceDisplay minHeight
              width: width,
            }}
          />
        );
      })}
    </div>
  );
};
