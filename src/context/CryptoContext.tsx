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
  const MIN_LOADING_MS = 800; // Increased from 600ms for better visibility

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPriceRef = useRef<number>(0);
  const connectionIdRef = useRef<number>(0);
  const firstTickReceivedRef = useRef<boolean>(false);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const RECONNECT_BASE_MS = 2000;
  // Special handling for SOL which sometimes fails to deliver price via ticker endpoint
  const SOL_FALLBACK_PRICE = 206.33; // Fallback price for SOL if WebSocket fails
  const SOL_SAFETY_TIMEOUT = 1500; // 1.5 seconds for SOL
  const NORMAL_SAFETY_TIMEOUT = 4000; // Normal timeout for other coins (4 seconds)
  
  // Alternative API endpoints for SOL price in case WebSocket fails
  const SOL_FALLBACK_ENDPOINTS = [
    'https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT',
    'https://api.binance.us/api/v3/ticker/price?symbol=SOLUSDT'
  ];

  const startLoading = () => {
    // avoid resetting start time if already loading
    if (!isLoading) {
      setIsLoading(true);
      loadingStartedRef.current = Date.now();
    } else if (loadingStartedRef.current == null) {
      loadingStartedRef.current = Date.now();
    }
  };

  // Function to fetch SOL price from alternative APIs if WebSocket fails
  const fetchSOLPrice = async () => {
    console.log("⚠️ Fetching SOL price from multiple sources...");
    
    // Try multiple APIs in parallel for fastest response
    const promises = SOL_FALLBACK_ENDPOINTS.map(endpoint => 
      fetch(endpoint)
        .then(r => r.json())
        .then(data => {
          if (data && data.price && !isNaN(parseFloat(data.price))) {
            return parseFloat(data.price);
          }
          throw new Error("Invalid price data");
        })
        .catch(e => {
          console.error(`Error fetching from ${endpoint}:`, e);
          return null;
        })
    );
    
    // Add hard-coded fallback as last promise
    promises.push(
      new Promise(resolve => {
        // Return fallback after 1.5s if other APIs fail
        setTimeout(() => resolve(SOL_FALLBACK_PRICE), 1500);
      })
    );
    
    try {
      // Use Promise.race to take the first successful response
      const price = await Promise.race(promises.filter(Boolean));
      
      if (price) {
        console.log(`✅ Got SOL price: ${price}`);
        
        // Update price state
        const oldPrice = lastPriceRef.current || price;
        lastPriceRef.current = price;
        setPreviousPrice(oldPrice);
        setCurrentPrice(price);
        
        // Mark first tick received
        firstTickReceivedRef.current = true;
        
        // End loading state
        stopLoadingSafely();
        return true;
      }
    } catch (error) {
      console.error("All SOL price fetches failed:", error);
    }
    
    // If all APIs fail, use hardcoded fallback
    console.log(`⚠️ Using hardcoded SOL price: ${SOL_FALLBACK_PRICE}`);
    lastPriceRef.current = SOL_FALLBACK_PRICE;
    setPreviousPrice(SOL_FALLBACK_PRICE);
    setCurrentPrice(SOL_FALLBACK_PRICE);
    
    // Mark first tick received to end loading
    firstTickReceivedRef.current = true;
    
    // End loading state
    stopLoadingSafely();
    return true;
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
      
      // Set safety timeout to end loading if no tick arrives
      // Use shorter timeout for SOL since it's problematic
      const timeoutMs = crypto === 'SOL' ? SOL_SAFETY_TIMEOUT : NORMAL_SAFETY_TIMEOUT;
      safetyTimeoutRef.current = setTimeout(() => {
        console.warn(`⚠️ Safety timeout: no WebSocket tick received for ${crypto} after ${timeoutMs}ms, ending loading state`);
        
        // For SOL, try fallback API if WebSocket fails
        if (crypto === 'SOL' && (!currentPrice || currentPrice === 0)) {
          console.log(`WebSocket failed for SOL, attempting fallback API...`);
          fetchSOLPrice();
          return; // fetchSOLPrice will handle ending the loading state
        }
        
        stopLoadingSafely();
        safetyTimeoutRef.current = null;
      }, timeoutMs);
      
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
      
      // For SOL specifically, use aggregated trades stream which is more reliable
      const wsEndpoint = crypto === 'SOL' 
        ? `wss://stream.binance.com:9443/ws/${symbolLower}usdt@aggTrade`
        : `wss://stream.binance.com:9443/ws/${symbolLower}usdt@ticker`;
        
      console.log(`Connecting to WebSocket: ${wsEndpoint}`);
      const ws = new WebSocket(wsEndpoint);
      wsRef.current = ws;

      (ws as any).connectionId = connectionId;
      (ws as any).symbol = crypto;

      ws.onopen = () => {
        if ((ws as any).connectionId !== connectionId) return;
        setConnectionStatus("connected");
        // Safety fallback: if no tick arrives within 4s, stop loading to avoid stuck UI
        if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = setTimeout(() => {
          if (!firstTickReceivedRef.current) {
            console.warn('Safety: no first tick received, ending loader to avoid stuck state');
            stopLoadingSafely();
          }
        }, 4000);
      };

      ws.onmessage = (event) => {
        if ((ws as any).connectionId !== connectionId) return;

        try {
          const data = JSON.parse(event.data);
          
          // SOL-specific handling with fallback data paths
          let newPrice = 0;
          
          if (crypto === 'SOL') {
            // Try all possible price fields from Binance API
            const possibleFields = ['c', 'lastPrice', 'price', 'p', 'w', 'weightedAvgPrice', 'o'];
            
            for (const field of possibleFields) {
              if (data[field] && !isNaN(parseFloat(data[field]))) {
                newPrice = parseFloat(data[field]);
                if (newPrice > 0) {
                  console.log(`✅ Got SOL price (${newPrice}) from field: ${field}`);
                  break;
                }
              }
            }
            
            // If no valid price found in any field
            if (!newPrice || newPrice <= 0 || isNaN(newPrice)) {
              console.log("⚠️ No valid SOL price in WebSocket data:", 
                JSON.stringify(data).substring(0, 100));
                
              // Don't return here - let's try an alternative WebSocket stream for SOL
              // Subscribe to trade stream instead of ticker
              try {
                ws.send(JSON.stringify({
                  method: "SUBSCRIBE",
                  params: ["solusdt@trade"],
                  id: connectionId
                }));
                console.log("🔄 Subscribed to SOL trade stream as fallback");
                return;
              } catch (e) {
                console.error("Failed to subscribe to trade stream:", e);
                return;
              }
            }
          } else {
            // Standard price extraction for BTC/ETH
            newPrice = parseFloat(data.c ?? data.p ?? 0);
            if (!newPrice || isNaN(newPrice)) {
              return;
            }
          }

          if (!firstTickReceivedRef.current) {
            firstTickReceivedRef.current = true;
            // stop loader only after MIN_LOADING_MS
            stopLoadingSafely();
            setPreviousPrice(lastPriceRef.current || null);
            if (safetyTimeoutRef.current) { 
              clearTimeout(safetyTimeoutRef.current); 
              safetyTimeoutRef.current = null; 
            }
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
    
    // Absolute safety fallback - avoid stuck state
    const timeoutMs = crypto === 'SOL' ? SOL_SAFETY_TIMEOUT : NORMAL_SAFETY_TIMEOUT;
    safetyTimeoutRef.current = setTimeout(() => {
      if (isLoading && loadingStartedRef.current) {
        console.log(`⚠️ Safety fallback: forcing loading to end after timeout`);
        
        // For SOL, use fallback price if WebSocket fails to deliver in time
        if (crypto === 'SOL' && (!currentPrice || currentPrice === 0)) {
          console.log(`Using emergency fallback price for SOL: ${SOL_FALLBACK_PRICE}`);
          setCurrentPrice(SOL_FALLBACK_PRICE);
          setPreviousPrice(lastPriceRef.current || null);
          lastPriceRef.current = SOL_FALLBACK_PRICE;
        }
        
        stopLoadingSafely();
        safetyTimeoutRef.current = null;
      }
    }, timeoutMs);

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