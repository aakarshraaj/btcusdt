import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { mockPriceProvider } from "../utils/mockPriceData";

// Multi-crypto support
const SUPPORTED_CRYPTOS = ["BTC", "ETH", "SOL"] as const;
type SupportedCrypto = (typeof SUPPORTED_CRYPTOS)[number];

interface CryptoContextType {
  currentPrice: number | null;
  previousPrice: number | null;
  selectedCrypto: SupportedCrypto;
  connectionStatus: "connecting" | "connected" | "disconnected";
  isSwitchingCrypto: boolean;
  isLoading: boolean;
  setSelectedCrypto: (crypto: SupportedCrypto) => void;
}

const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

interface CryptoProviderProps {
  children: ReactNode;
}

export function CryptoProvider({ children }: CryptoProviderProps) {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<SupportedCrypto>("BTC");
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [isSwitchingCrypto, setIsSwitchingCrypto] = useState<boolean>(false);

  // loading state + minimum visible duration to avoid flicker
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const loadingStartedRef = useRef<number | null>(null);
  const MIN_LOADING_MS = 800; // Increased from 600ms for better visibility

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPriceRef = useRef<number>(0);
  const connectionIdRef = useRef<number>(0);
  const firstTickReceivedRef = useRef<boolean>(false);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  const MAX_RETRIES = 3;

  const RECONNECT_BASE_MS = 2000;

  const startLoading = () => {
    // avoid resetting start time if already loading
    if (!isLoading) {
      setIsLoading(true);
      loadingStartedRef.current = Date.now();
    } else if (loadingStartedRef.current == null) {
      loadingStartedRef.current = Date.now();
    }
  };

  const stopLoadingSafely = () => {
    const started = loadingStartedRef.current ?? 0;
    const elapsed = Date.now() - started;
    
    // Clear any safety timeout
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
    
    // Ensure we always show loading for at least MIN_LOADING_MS
    const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
    loadingStartedRef.current = null;
    
    // Always use a minimum remaining time to prevent flicker
    const actualRemaining = Math.max(200, remaining);
    
    setTimeout(() => {
      setIsLoading(false);
    }, actualRemaining);
  };

  // WebSocket connection logic with crypto support (using ticker stream)
  const connectWebSocket = (crypto: SupportedCrypto = selectedCrypto) => {
    try {
      startLoading();

      // Clear any existing safety timeout
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }

      setCurrentPrice(null);
      firstTickReceivedRef.current = false;

      // Close existing WebSocket if any
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        try {
          wsRef.current.close();
        } catch (_) {}
        wsRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      const connectionId = ++connectionIdRef.current;
      const symbolLower = crypto.toLowerCase();
      
      // Try WebSocket connection first, fallback to mock data if it fails
      const wsEndpoint = `wss://stream.binance.com:9443/ws/${symbolLower}usdt@ticker`;
      console.log(`Attempting WebSocket connection: ${wsEndpoint}`);
      
      const ws = new WebSocket(wsEndpoint);
      wsRef.current = ws;

      (ws as any).connectionId = connectionId;
      (ws as any).symbol = crypto;

      // Set a timeout to fallback to mock data if WebSocket fails
      const fallbackTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.log(`⚠️ WebSocket connection failed for ${crypto} after 10 seconds, falling back to mock data`);
          ws.close();
          startMockDataConnection(crypto);
        }
      }, 10000); // 10 second timeout - increased from 3 seconds

      ws.onopen = () => {
        if ((ws as any).connectionId !== connectionId) return;
        clearTimeout(fallbackTimeout);
        retryCountRef.current = 0; // Reset retry count on successful connection
        console.log(`✅ WebSocket connected for ${crypto}`);
        setConnectionStatus("connected");
      };

      ws.onmessage = (event) => {
        if ((ws as any).connectionId !== connectionId) return;
        clearTimeout(fallbackTimeout);

        try {
          const data = JSON.parse(event.data);
          const newPrice = parseFloat(data.c ?? data.p ?? 0);
          
          if (!newPrice || isNaN(newPrice)) {
            return;
          }

          if (!firstTickReceivedRef.current) {
            firstTickReceivedRef.current = true;
            stopLoadingSafely();
            setPreviousPrice(lastPriceRef.current || null);
          }

          const oldPrice = lastPriceRef.current || 0;
          lastPriceRef.current = newPrice;

          setPreviousPrice(oldPrice || null);
          setCurrentPrice(newPrice);
        } catch (error) {
          console.error("Error parsing WebSocket data:", error);
        }
      };

      ws.onclose = (ev) => {
        if ((ws as any).connectionId !== connectionId) return;
        clearTimeout(fallbackTimeout);
        
        // Try to reconnect up to MAX_RETRIES times before falling back to mock data
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          console.warn(`🔌 WebSocket closed for ${crypto}, attempting retry ${retryCountRef.current}/${MAX_RETRIES}`);
          setTimeout(() => connectWebSocket(crypto), RECONNECT_BASE_MS * retryCountRef.current);
        } else {
          console.warn(`🔌 WebSocket closed for ${crypto} after ${MAX_RETRIES} retries, falling back to mock data`);
          retryCountRef.current = 0; // Reset for next connection attempt
          startMockDataConnection(crypto);
        }
      };

      ws.onerror = (error) => {
        if ((ws as any).connectionId !== connectionId) return;
        clearTimeout(fallbackTimeout);
        console.error("WebSocket error:", error);
        
        // Don't immediately fall back to mock data on error - let onclose handle it
      };
    } catch (error) {
      console.error("Error creating WebSocket, falling back to mock data:", error);
      startMockDataConnection(crypto);
    }
  };

  // Start mock data connection when WebSocket fails
  const startMockDataConnection = (crypto: SupportedCrypto) => {
    console.log(`🎭 Starting mock data connection for ${crypto}`);
    setConnectionStatus("connected"); // Mock connection is always "connected"
    
    // Stop any existing mock subscriptions
    mockPriceProvider.cleanup();
    
    // Start mock data
    mockPriceProvider.subscribe(crypto, (data) => {
      if (!firstTickReceivedRef.current) {
        firstTickReceivedRef.current = true;
        stopLoadingSafely();
        setPreviousPrice(lastPriceRef.current || null);
      }

      const oldPrice = lastPriceRef.current || 0;
      lastPriceRef.current = data.price;

      setPreviousPrice(oldPrice || null);
      setCurrentPrice(data.price);
    });
  };

  // Function to switch cryptocurrencies
  const handleSetSelectedCrypto = (crypto: SupportedCrypto) => {
    console.log(`⚠️ SWITCHING TO ${crypto} - forcing loading state`);
    setIsSwitchingCrypto(true);

    // FORCE loading state - defensive approach
    setIsLoading(true);

    // Immediately clear prices to prevent flash of old price
    setCurrentPrice(null);
    setPreviousPrice(null);

    // Set new crypto
    setSelectedCrypto(crypto);

    // Reset tracking refs
    lastPriceRef.current = 0;
    firstTickReceivedRef.current = false;

    // Ensure loading state lasts long enough to be visible
    loadingStartedRef.current = Date.now();

    // Clear any existing safety timeout
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
    
    // Stop any existing mock data
    mockPriceProvider.cleanup();

    setTimeout(() => {
      setIsSwitchingCrypto(false);
    }, 2000);
  };

  useEffect(() => {
    // start connection on mount and whenever selectedCrypto changes
    connectWebSocket(selectedCrypto);

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        try {
          wsRef.current.close();
        } catch (_) {}
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      // Clean up mock data provider
      mockPriceProvider.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCrypto]);

  return (
    <CryptoContext.Provider
      value={{
        currentPrice,
        previousPrice,
        selectedCrypto,
        connectionStatus,
        isSwitchingCrypto,
        isLoading,
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
    throw new Error("useCrypto must be used within a CryptoProvider");
  }
  return context;
}