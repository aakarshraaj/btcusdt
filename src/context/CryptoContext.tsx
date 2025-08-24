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
  currentPrice: number;
  previousPrice: number;
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
  const [currentPrice, setCurrentPrice] = useState<number>(115055.31);
  const [previousPrice, setPreviousPrice] = useState<number>(115055.31);
  const [selectedCrypto, setSelectedCrypto] =
    useState<SupportedCrypto>("BTC");
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [isSwitchingCrypto, setIsSwitchingCrypto] = useState<boolean>(false);

  // NEW: loading state (true until first valid tick on each connection / on switch / reconnect)
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPriceRef = useRef<number>(currentPrice);
  const connectionIdRef = useRef<number>(0);
  const firstTickReceivedRef = useRef<boolean>(false);

  const RECONNECT_BASE_MS = 2000;

  // WebSocket connection logic with crypto support (using ticker stream)
  const connectWebSocket = (crypto: SupportedCrypto = selectedCrypto) => {
    try {
      // mark loading until first tick arrives
      setIsLoading(true);
      firstTickReceivedRef.current = false;

      // Safely close existing socket
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        try {
          wsRef.current.close();
        } catch (_) {}
        wsRef.current = null;
      }

      // Cancel any pending reconnect timers
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Increment connection ID to handle race conditions
      const connectionId = ++connectionIdRef.current;

      const symbolLower = crypto.toLowerCase();
      // Use ticker stream (stable aggregated ticker)
      const ws = new WebSocket(
        `wss://stream.binance.com:9443/ws/${symbolLower}usdt@ticker`
      );
      wsRef.current = ws;

      // Add connection ID to the WebSocket for tracking
      (ws as any).connectionId = connectionId;
      (ws as any).symbol = crypto;

      ws.onopen = () => {
        // ignore stale opens
        if ((ws as any).connectionId !== connectionId) return;
        console.log(`✅ Connected to Binance WebSocket for ${crypto}/USDT`);
        setConnectionStatus("connected");
        // remain in loading state until first valid tick
      };

      ws.onmessage = (event) => {
        // Guard against race conditions during switching
        if ((ws as any).connectionId !== connectionId) return;

        try {
          const data = JSON.parse(event.data);
          // ticker payload uses "c" (last price) and "v" for volume
          const newPrice = parseFloat(data.c ?? data.p);
          const newVolume = parseFloat(data.v ?? data.q ?? 0);

          if (!newPrice || isNaN(newPrice)) return;

          // mark first tick received (stop loading) BEFORE updating UI
          if (!firstTickReceivedRef.current) {
            firstTickReceivedRef.current = true;
            setIsLoading(false);
          }

          const oldPrice = lastPriceRef.current || 0;
          lastPriceRef.current = newPrice;

          setPreviousPrice(oldPrice);
          setCurrentPrice(newPrice);
        } catch (error) {
          console.error("Error parsing WebSocket data:", error);
        }
      };

      ws.onclose = (ev) => {
        // stale connection? ignore
        if ((ws as any).connectionId !== connectionId) return;

        console.warn(
          `🔌 WebSocket closed for ${crypto} (ID: ${connectionId})`,
          ev
        );
        setConnectionStatus("disconnected");
        // show loader while reconnecting
        setIsLoading(true);

        // schedule reconnect with gentle backoff (only if this is still the latest)
        if ((ws as any).connectionId === connectionIdRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setConnectionStatus("connecting");
            connectWebSocket(selectedCrypto);
          }, RECONNECT_BASE_MS);
        }
      };

      ws.onerror = (error) => {
        // stale connection? ignore
        if ((ws as any).connectionId !== connectionId) return;
        console.error("WebSocket error:", error);
        setConnectionStatus("disconnected");
        setIsLoading(true);
        try {
          ws.close();
        } catch (_) {}
      };
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      setConnectionStatus("disconnected");
      setIsLoading(true);
    }
  };

  // Function to switch cryptocurrencies
  const handleSetSelectedCrypto = (crypto: SupportedCrypto) => {
    console.log(`🔄 Switching to ${crypto}`);
    setIsSwitchingCrypto(true);

    // show loader immediately when switching
    setIsLoading(true);

    setSelectedCrypto(crypto);

    // do NOT set currentPrice to 0 — hide old value behind loader to avoid flicker
    // Clear refs to prevent false data
    lastPriceRef.current = 0;
    firstTickReceivedRef.current = false;

    // Clear switching state after a short delay to allow stabilization
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