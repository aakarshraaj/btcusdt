import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

// Multi-crypto support
const SUPPORTED_CRYPTOS = ['BTC', 'ETH', 'SOL'] as const;
type SupportedCrypto = typeof SUPPORTED_CRYPTOS[number];

interface CryptoContextType {
  currentPrice: number;
  previousPrice: number;
  selectedCrypto: SupportedCrypto;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  isSwitchingCrypto: boolean;
  setSelectedCrypto: (crypto: SupportedCrypto) => void;
}

const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

interface CryptoProviderProps {
  children: ReactNode;
}

export function CryptoProvider({ children }: CryptoProviderProps) {
  const [currentPrice, setCurrentPrice] = useState(115055.31);
  const [previousPrice, setPreviousPrice] = useState(115055.31);
  const [selectedCrypto, setSelectedCrypto] = useState<SupportedCrypto>('BTC');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [isSwitchingCrypto, setIsSwitchingCrypto] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPriceRef = useRef<number>(currentPrice);
  const connectionIdRef = useRef<number>(0);

  // WebSocket connection logic with crypto support
  const connectWebSocket = (crypto: SupportedCrypto = selectedCrypto) => {
    try {
      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Increment connection ID to handle race conditions
      const connectionId = ++connectionIdRef.current;

      const symbolLower = crypto.toLowerCase();
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbolLower}usdt@trade`);
      wsRef.current = ws;
      
      // Add connection ID to the WebSocket for tracking
      (ws as any).connectionId = connectionId;

      ws.onopen = () => {
        console.log(`Connected to Binance WebSocket for ${crypto}/USDT`);
        setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        // Guard against race conditions during switching
        if ((ws as any).connectionId !== connectionId) return;
        
        try {
          const data = JSON.parse(event.data);
          const newPrice = parseFloat(data.p);

          if (!newPrice || isNaN(newPrice)) return;

          const oldPrice = lastPriceRef.current;
          lastPriceRef.current = newPrice;

          setPreviousPrice(oldPrice);
          setCurrentPrice(newPrice);
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        reconnectTimeoutRef.current = setTimeout(() => {
          setConnectionStatus('connecting');
          connectWebSocket(crypto);
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setConnectionStatus('disconnected');
    }
  };

  // Function to switch cryptocurrencies
  const handleSetSelectedCrypto = (crypto: SupportedCrypto) => {
    console.log(`Switching to ${crypto}`);
    setIsSwitchingCrypto(true);
    setSelectedCrypto(crypto);
    
    // Reset price data when switching
    setPreviousPrice(0);
    setCurrentPrice(0);
    
    // Clear refs to prevent false data
    lastPriceRef.current = 0;
    
    // Note: WebSocket connection will be handled by useEffect when selectedCrypto changes
    // This prevents double connections and potential price flicker
    
    // Clear switching state after a delay to allow data to stabilize
    setTimeout(() => {
      setIsSwitchingCrypto(false);
    }, 2000);
  };

  useEffect(() => {
    connectWebSocket(selectedCrypto);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [selectedCrypto]);

  return (
    <CryptoContext.Provider
      value={{
        currentPrice,
        previousPrice,
        selectedCrypto,
        connectionStatus,
        isSwitchingCrypto,
        setSelectedCrypto: handleSetSelectedCrypto,
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
}

export function useCrypto() {
  const context = useContext(CryptoContext);
  if (context === undefined) {
    throw new Error('useCrypto must be used within a CryptoProvider');
  }
  return context;
}