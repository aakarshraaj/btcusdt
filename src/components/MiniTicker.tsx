import { motion } from 'motion/react';
import { useCrypto } from '../context/CryptoContext';
import { formatPriceSafe } from '../utils/formatPrice';

interface MiniTickerProps {
  onTickerClick?: () => void;
}

export function MiniTicker({ onTickerClick }: MiniTickerProps) {
  const { currentPrice, previousPrice, selectedCrypto, connectionStatus } = useCrypto();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatPrice = (price?: number | null) => {
    return `$${formatPriceSafe(price ?? undefined as any)}`;
  };

  const getCryptoSymbol = () => {
    switch (selectedCrypto) {
      case 'BTC': return '₿';
      case 'ETH': return 'Ξ';
      case 'SOL': return '◎';
      default: return '₿';
    }
  };

  const priceChange = previousPrice && previousPrice > 0 && currentPrice != null ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <motion.div
      className="inline-flex items-center gap-3 bg-muted rounded-xl border border-border px-4 py-3 cursor-pointer hover:bg-accent transition-colors"
      onClick={onTickerClick}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center">
          <span className="text-sm leading-none">{getCryptoSymbol()}</span>
        </div>
        <div className="flex flex-col">
          <div className="text-sm font-bold text-foreground">
            {formatPrice(currentPrice)}
          </div>
          <div className={`text-xs ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPositive ? '+' : ''}{isFinite(priceChange) ? priceChange.toFixed(2) : '0.00'}%
          </div>
        </div>
      </div>
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
    </motion.div>
  );
}