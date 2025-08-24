import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";

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
  const MIN_LOADING_MS = 600; // INCREASED from 300ms for better visibility

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPriceRef = useRef<number>(0);
  const connectionIdRef = useRef<number>(0);
  const firstTickReceivedRef = useRef<boolean>(false);

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
    const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
    loadingStartedRef.current = null;
    if (remaining > 0) {
      // guarantee minimum visible loader time
      setTimeout(() => setIsLoading(false), remaining);
    } else {
      setIsLoading(false);
    }
  };

  // WebSocket connection logic with crypto support (using ticker stream)
  const connectWebSocket = (crypto: SupportedCrypto = selectedCrypto) => {
    try {
      startLoading();
      setCurrentPrice(null);
      firstTickReceivedRef.current = false;

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
      const ws = new WebSocket(
        `wss://stream.binance.com:9443/ws/${symbolLower}usdt@ticker`
      );
      wsRef.current = ws;

      (ws as any).connectionId = connectionId;
      (ws as any).symbol = crypto;

      ws.onopen = () => {
        if ((ws as any).connectionId !== connectionId) return;
        setConnectionStatus("connected");
      };

      ws.onmessage = (event) => {
        if ((ws as any).connectionId !== connectionId) return;

        try {
          const data = JSON.parse(event.data);
          const newPrice = parseFloat(data.c ?? data.p);
          if (!newPrice || isNaN(newPrice)) return;

          if (!firstTickReceivedRef.current) {
            firstTickReceivedRef.current = true;
            // stop loader only after MIN_LOADING_MS
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
        console.warn(`🔌 WebSocket closed for ${crypto} (ID: ${connectionId})`, ev);
        setConnectionStatus("disconnected");
        startLoading();
        setCurrentPrice(null);

        if ((ws as any).connectionId === connectionIdRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setConnectionStatus("connecting");
            connectWebSocket(selectedCrypto);
          }, RECONNECT_BASE_MS);
        }
      };

      ws.onerror = (error) => {
        if ((ws as any).connectionId !== connectionId) return;
        console.error("WebSocket error:", error);
        setConnectionStatus("disconnected");
        startLoading();
        setCurrentPrice(null);
        try {
          ws.close();
        } catch (_) {}
      };
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      setConnectionStatus("disconnected");
      startLoading();
      setCurrentPrice(null);
    }
  };

  // Function to switch cryptocurrencies
  const handleSetSelectedCrypto = (crypto: SupportedCrypto) => {
    setIsSwitchingCrypto(true);
    startLoading();

    // clear displayed prices immediately to show loader
    setCurrentPrice(null);
    setPreviousPrice(null);

    setSelectedCrypto(crypto);
    lastPriceRef.current = 0;
    firstTickReceivedRef.current = false;

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