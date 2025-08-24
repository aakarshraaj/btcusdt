import React from "react";

interface PriceSkeletonProps {
  blocks?: number;
  className?: string;
}

export const PriceSkeleton: React.FC<PriceSkeletonProps> = ({ 
  blocks = 3, 
  className = "" 
}) => {
  // Double the height again to 320px for maximum stability
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      {Array.from({ length: blocks }).map((_, i) => (
        <div 
          key={i} 
          className="flex-1 rounded-[32px] bg-muted/70 animate-pulse"
          style={{
            height: "320px", // Doubled from 160px to 320px
            minHeight: "320px",
            minWidth: i === blocks - 1 ? '180px' : '260px',
            // Add some max-width to prevent extreme stretching
            maxWidth: i === blocks - 1 ? '240px' : '420px',
          }}
        />
      ))}
    </div>
  );
};
