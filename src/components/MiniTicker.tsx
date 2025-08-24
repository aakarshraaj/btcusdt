import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface MiniTickerProps {
  onTickerClick?: () => void;
}

export function MiniTicker({ onTickerClick }: MiniTickerProps) {
  const [currentPrice, setCurrentPrice] = useState(115055.31);
  const [previousPrice, setPreviousPrice] = useState(115055.31);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPriceRef = useRef<number>(currentPrice);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const newPrice = parseFloat(data.p);
          const lastPrice = lastPriceRef.current;

          setPreviousPrice(lastPrice);
          setCurrentPrice(newPrice);
          lastPriceRef.current = newPrice;
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        reconnectTimeoutRef.current = setTimeout(() => {
          setConnectionStatus('connecting');
          connectWebSocket();
        }, 3000);
      };

      ws.onerror = () => {
        setConnectionStatus('disconnected');
      };
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
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
          <span className="text-sm leading-none">₿</span>
        </div>
        <div className="flex flex-col">
          <div className="text-sm font-bold text-foreground">
            {formatPrice(currentPrice)}
          </div>
          <div className={`text-xs ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
          </div>
        </div>
      </div>
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
    </motion.div>
  );
}