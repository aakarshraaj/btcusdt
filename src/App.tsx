import { useState, useEffect, useRef } from 'react'
import { formatPriceSafe, splitPriceParts } from './utils/formatPrice'
import { motion } from 'motion/react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
// If the file exists at src/pages/calculators.tsx, keep as is.
// Otherwise, update the path to the correct location, for example:
// import Calculators from './Calculators'; // If located at src/Calculators.tsx
// The pages folder lives inside src — use a relative path from this file (src/App.tsx):
import { CalculatorsIndex as Calculators } from './pages/CalculatorsIndex';
import { PriceSkeleton } from './components/ui/PriceSkeleton';
// If the file exists at src/Calculators.tsx, use this instead:
// import Calculators from './Calculators';
/* No additional code needed at $PLACEHOLDER$ */
export default function App() {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [previousPrice, setPreviousPrice] = useState<number | null>(null)
  const [volume, setVolume] = useState(0.12345)
  const [previousVolume, setPreviousVolume] = useState(0.12345)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const wsRef = useRef<WebSocketWithMetadata | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastPriceRef = useRef<number>(0)
  const lastVolumeRef = useRef<number>(volume)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const lastHeadlineRef = useRef<number>(0)
  const [showHeadline, setShowHeadline] = useState(false)
  const [headlineText, setHeadlineText] = useState('')
  // Track recent prices for 10-min change + audio tings
  const priceHistoryRef = useRef<Array<{ ts: number, price: number }>>([])
  const [change10m, setChange10m] = useState(0)
  const lastTingUpRef = useRef<number>(0)
  const lastTingDownRef = useRef<number>(0)
  // Reconnect/backoff helpers
  const reconnectAttemptsRef = useRef<number>(0);
  const RECONNECT_BASE_MS = 2000;
  const MAX_RECONNECTS = 5;
  // Visit streak (gamification)
  const [streak, setStreak] = useState<number>(1)
  // Footer typing effect
  const footerPreText = 'Designed and Built by '
  const footerLinkText = 'Aakarsh'
  const [footerTypedCount, setFooterTypedCount] = useState(0)
  const [footerDim, setFooterDim] = useState(false)
  // UI visibility toggle
  const [showUI, setShowUI] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const SUPPORTED_CRYPTOS = ['BTC', 'ETH', 'SOL'] as const
  type SupportedCrypto = typeof SUPPORTED_CRYPTOS[number]
  const [selectedCrypto, setSelectedCrypto] = useState<SupportedCrypto>('BTC')
  const [connectionId, setConnectionId] = useState(0)
  // Extend WebSocket interface to support our metadata
  interface WebSocketWithMetadata extends WebSocket {
    connectionId?: number
    symbol?: SupportedCrypto
  }

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    if (saved === 'light' || saved === 'dark') return saved
    return 'light'
  })

  // Global connection manager to ensure only ONE WebSocket is active
  const [activeConnection, setActiveConnection] = useState<string | null>(null)

  // Flag to prevent sounds during cryptocurrency switches
  const [isSwitchingCrypto, setIsSwitchingCrypto] = useState(false)
  // Loading UX: true while switching crypto or until first WS tick arrives
  const [isLoading, setIsLoading] = useState(true)
  const firstTickReceivedRef = useRef(false)
  
  // import safe formatters locally (use the util file)
  // (import below to keep patch minimal - we add runtime imports via require-like import)

  // INDIVIDUAL WEBSOCKET CONNECTIONS - CONNECTION-ID DRIVEN (NO RACE CONDITIONS)
  const connectWebSocket = (symbol: SupportedCrypto) => {
    try {
      // If already connected to this symbol, do nothing
      if (activeConnection === symbol && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log(`ℹ️ Already connected to ${symbol} — skipping`)
        return
      }
      // Prevent creating too many reconnects for same symbol
      reconnectAttemptsRef.current[symbol] = reconnectAttemptsRef.current[symbol] || 0
      if (reconnectAttemptsRef.current[symbol] >= MAX_RECONNECTS) {
        console.warn(`⚠️ Max reconnect attempts reached for ${symbol}. Backing off.`)
        setConnectionStatus('disconnected')
        return
      }
      // Close existing connection if present and not already CLOSED
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED && wsRef.current.readyState !== WebSocket.CLOSING) {
        console.log(`🔌 Closing existing connection for ${wsRef.current.symbol}`)
        try { wsRef.current.close() } catch (_) {}
        wsRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      setActiveConnection(null)
      setConnectionStatus('connecting')
      const connectionId = Date.now()
      const symbolLower = symbol.toLowerCase()
      // Use the ticker stream (aggregated) — more stable for price + volume
      const url = `wss://stream.binance.com:9443/ws/${symbolLower}usdt@ticker`
  console.log(`🚀 Creating NEW WebSocket for ${symbol}/USDT -> ${url} (ID: ${connectionId})`)
      const ws = new WebSocket(url) as WebSocketWithMetadata
      ws.connectionId = connectionId
      ws.symbol = symbol
      wsRef.current = ws
  // mark loading until first message arrives for this connection
  setIsLoading(true)
  firstTickReceivedRef.current = false
      ws.onopen = () => {
        if (ws.connectionId !== connectionId) return
        console.log(`✅ WebSocket OPEN for ${symbol} (ID: ${connectionId})`)
        setConnectionStatus('connected')
        setActiveConnection(symbol)
        // reset reconnect attempts on success
        reconnectAttemptsRef.current[symbol] = 0
      }
      ws.onmessage = (event) => {
        if (ws.connectionId !== connectionId) return
        try {
          const data = JSON.parse(event.data)
          // ticker message uses fields like "c" (last price) and "v" (volume)
          const newPrice = parseFloat(data.c ?? data.p ?? NaN)
          const newVolume = parseFloat(data.v ?? data.q ?? 0)
          if (isNaN(newPrice)) return
          // first valid tick -> clear loading state (but ensure we only do this once)
          if (!firstTickReceivedRef.current) {
            firstTickReceivedRef.current = true
            // keep spinner for a tiny bit to avoid flicker
            setTimeout(() => setIsLoading(false), 120)
          }
          const oldPrice = lastPriceRef.current
          lastPriceRef.current = newPrice
          setPreviousPrice(oldPrice)
          setCurrentPrice(newPrice)
          setVolume(newVolume)
          setLastUpdated(new Date())
        } catch (err) {
          console.error('❌ WS parse error:', err)
        }
      }
      ws.onclose = (ev) => {
        if (ws.connectionId !== connectionId) return
        console.warn(`🔌 WebSocket CLOSED for ${symbol} (ID: ${connectionId})`, ev.reason || ev)
        if (activeConnection === symbol) {
          setActiveConnection(null)
          setConnectionStatus('disconnected')
        }
        // schedule reconnect with exponential-ish backoff
        reconnectAttemptsRef.current[symbol] = (reconnectAttemptsRef.current[symbol] || 0) + 1
        const attempt = reconnectAttemptsRef.current[symbol]
        const backoff = RECONNECT_BASE_MS * Math.min(10, Math.pow(1.8, attempt))
        reconnectTimeoutRef.current = setTimeout(() => {
          // only reconnect if still selected
          if (selectedCrypto === symbol) {
            console.log(`♻️ Reconnecting to ${symbol} after ${Math.round(backoff)}ms (attempt ${attempt})`)
            connectWebSocket(symbol)
          }
        }, backoff) as unknown as NodeJS.Timeout
      }
      ws.onerror = (err) => {
        if (ws.connectionId !== connectionId) return
        console.error(`❌ WebSocket error for ${symbol} (ID: ${connectionId}):`, err)
        // close socket to trigger onclose/backoff logic
        try { ws.close() } catch (_) {}
      }
    } catch (error) {
      console.error(`❌ Failed to create WebSocket for ${symbol}:`, error)
      setConnectionStatus('disconnected')
    }
  }

  useEffect(() => {
    // Initial connection to multi-stream WebSocket
    console.log('🚀 Initial connection to multi-stream WebSocket')
  setSelectedCrypto('BTC')
    connectWebSocket('BTC')
    return () => {
      // Cleanup WebSocket on unmount
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      setActiveConnection(null)
    }
  }, []) // Only run once on mount - no dependencies

  // Function to switch cryptocurrencies - PROPERLY MANAGED CONNECTIONS
  const switchCrypto = (crypto: 'BTC' | 'ETH' | 'SOL') => {
    console.log(`🔄 Switching to ${crypto}`)

        // Set flag to prevent sounds during switch
    setIsSwitchingCrypto(true)

        // Update selected crypto
    setSelectedCrypto(crypto)

    // Reset state for new cryptocurrency (use null so loaders show)
  setCurrentPrice(null)
  setPreviousPrice(null)
    setVolume(0)
    setChange10m(0)
    setLastUpdated(new Date())
  setConnectionStatus('connecting')

        // Connect to new cryptocurrency - this will close old connection and open new one
    connectWebSocket(crypto)

        // Clear the flag after a short delay to allow connection to stabilize
    setTimeout(() => {
      setIsSwitchingCrypto(false)
    }, 2000) // 2 seconds should be enough for connection to stabilize
  }

  // Streak logic (daily visits)
  useEffect(() => {
    try {
      const key = 'visit_streak_v1'
      const today = new Date()
      const todayStr = today.toISOString().slice(0, 10)
      const raw = localStorage.getItem(key)
      if (!raw) {
        localStorage.setItem(key, JSON.stringify({ lastVisit: todayStr, streak: 1 }))
        setStreak(1)
        return
      }
      const obj = JSON.parse(raw)
      const last = obj?.lastVisit as string
      const prev = new Date(last)
      const diffDays = Math.floor((today.getTime() - new Date(prev.toISOString().slice(0,10)).getTime()) / (24 * 60 * 60 * 1000))
      if (todayStr === last) {
        setStreak(obj.streak || 1)
        return
      }
      if (diffDays === 1) {
        const next = (obj.streak || 1) + 1
        setStreak(next)
        localStorage.setItem(key, JSON.stringify({ lastVisit: todayStr, streak: next }))
      } else {
        setStreak(1)
        localStorage.setItem(key, JSON.stringify({ lastVisit: todayStr, streak: 1 }))
      }
    } catch (_) {
      // ignore
    }
  }, [])

  // Typewriter for footer
  useEffect(() => {
    const total = footerPreText.length + footerLinkText.length
    let interval: number | undefined
    const step = () => {
      setFooterTypedCount((prev) => {
        const next = Math.min(prev + 1, total)
        if (next === total) {
          window.clearInterval(interval)
          window.setTimeout(() => setFooterDim(true), 1400)
        }
        return next
      })
    }
    interval = window.setInterval(step, 28)
    return () => {
      if (interval) window.clearInterval(interval)
    }
  }, [])

  // Apply theme to <html>
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  // Play a short ping using Web Audio (no external asset required)
  const playPing = async (frequency: number) => {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!Ctx) return
      if (!audioCtxRef.current) {
        audioCtxRef.current = new Ctx()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') await ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = frequency
      gain.gain.value = 0.0001
      osc.connect(gain)
      gain.connect(ctx.destination)
      const now = ctx.currentTime
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15)
      osc.start(now)
      osc.stop(now + 0.18)
    } catch (_) {
      // ignore audio errors
    }
  }

  // Use central util to split price into parts. This ensures SOL (small prices) place integer in middle.
  const currentParts = splitPriceParts(currentPrice ?? undefined)
  const previousParts = splitPriceParts(previousPrice ?? undefined)
  // Only show numeric blocks when we have a valid price and not loading
  const hasValidPrice = !isLoading && currentPrice != null && isFinite(currentPrice) && currentPrice > 0
  let displayParts = hasValidPrice ? { first: currentParts.left || '', middle: currentParts.middle || '', decimal: currentParts.right || '' } : { first: '', middle: '', decimal: '' }

  // If left is empty (small price like SOL), swap to keep middle as main block and avoid an empty left block in the UI
  if (displayParts.first === '' && displayParts.middle) {
    // Render only middle + decimal; left remains hidden by using empty string
    displayParts = { first: '', middle: displayParts.middle, decimal: displayParts.decimal }
  }

  // Debug logging
  console.log(`Selected: ${selectedCrypto}, Price: ${currentPrice}, Parts:`, currentParts)
  console.log(`Display Parts:`, displayParts)
  console.log(`First: "${displayParts.first}", Middle: "${displayParts.middle}", Decimal: "${displayParts.decimal}"`)

  // Show headline + audio ping when the main left/middle block changes
  useEffect(() => {
    // Guard against crypto switching and invalid price history
    if (isSwitchingCrypto) return
    if (!previousPrice || previousPrice <= 0) return

    const firstNow = currentParts.left || currentParts.middle
    const firstPrev = previousParts.left || previousParts.middle
    if (!firstNow || !firstPrev || firstNow === firstPrev) return
    const nowTs = Date.now()
    if (nowTs - lastHeadlineRef.current < 1500) return
    lastHeadlineRef.current = nowTs
    const wentUp = parseFloat(firstNow) > parseFloat(firstPrev)
    const upPhrases = ['BULL RUN', 'DELICIOUS', 'TO THE MOON']
    const downPhrases = ['DIP ALERT', 'TASTY DISCOUNT', 'COOL DOWN']
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]
    const text = wentUp ? pick(upPhrases) : pick(downPhrases)
    setHeadlineText(text)
    setShowHeadline(true)
    playPing(wentUp ? 880 : 440)
    const t = setTimeout(() => setShowHeadline(false), 1200)
    return () => clearTimeout(t)
  }, [currentPrice, previousPrice, isSwitchingCrypto])

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500'
      case 'disconnected': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const PriceBlock = ({ value, previousValue }: { value: string, previousValue: string }) => {
    const [bgColor, setBgColor] = useState('bg-muted')

    useEffect(() => {
      // Show color changes for ANY block that actually changes value
      if (value !== previousValue && previousValue !== '0') {
        const numCurrent = parseFloat(value.replace(/[^0-9.-]/g, ''))
        const numPrevious = parseFloat(previousValue.replace(/[^0-9.-]/g, ''))
        // Only flash if there's an actual change in this specific block
        if (numCurrent !== numPrevious) {
          // Reset to base first
          setBgColor('bg-muted')
          const highlight = numCurrent > numPrevious
            ? 'bg-emerald-300/60 dark:bg-emerald-500/30'
            : 'bg-rose-300/60 dark:bg-rose-500/30'
          const startFlash = window.setTimeout(() => {
            setBgColor(highlight)
          }, 20)
          const endFlash = window.setTimeout(() => {
            setBgColor('bg-muted')
          }, 900)
          return () => {
            window.clearTimeout(startFlash)
            window.clearTimeout(endFlash)
          }
        }
      }

      // Always reset to base color
      setBgColor('bg-muted')
    }, [value, previousValue])

    return (
      <div 
        className={`${bgColor} box-border inline-flex items-center justify-center relative shrink-0 transition-colors duration-500 ease-out border border-border rounded-[28px] sm:rounded-[32px] lg:rounded-[44px] p-4 sm:p-6 md:p-8 lg:p-10`}
        style={{ 
          minHeight: '320px', // Match the skeleton height exactly
          minWidth: '180px',  // Ensure minimum width
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div className="font-['Space Grotesk',_sans-serif] font-bold leading-[0] relative shrink-0 text-foreground text-[clamp(80px,18vw,112px)] sm:text-[112px] md:text-[128px] lg:text-[160px] xl:text-[192px] text-nowrap">
          <p className="block leading-[normal] whitespace-pre">{value}</p>
        </div>
      </div>
    )
  }

  const navigate = useNavigate();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div className="bg-background text-foreground relative size-full min-h-screen">

                        {/* <<< VISIBLE FLOATING SWITCHER (always on top, high-contrast) >>> */}
            <div
              style={{
                position: 'fixed',
                top: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                background: 'rgba(0,0,0,0.85)',
                color: '#fff',
                padding: '6px',
                borderRadius: 12,
                display: 'inline-flex',
                gap: 6,
                boxShadow: '0 6px 18px rgba(0,0,0,0.6)'
              }}
            >
              {SUPPORTED_CRYPTOS.map((crypto) => (
                <button
                  key={crypto}
                  onClick={() => switchCrypto(crypto)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                    background: selectedCrypto === crypto ? '#fff' : 'transparent',
                    color: selectedCrypto === crypto ? '#000' : '#fff'
                  }}
                  aria-pressed={selectedCrypto === crypto}
                >
                  {crypto}
                </button>
              ))}
            </div>
            {/* <<< end floating switcher >>> */}

            {/* Headline overlay on major move */}
            {showHeadline && (
              <motion.div
                className="fixed top-8 inset-x-0 z-20 flex justify-center pointer-events-none"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="px-4 py-2 rounded-full bg-black/80 text-white text-xs tracking-widest uppercase shadow-sm border border-white/10">
                  {headlineText}
                </div>
              </motion.div>
            )}

            {/* Top bar: UI Toggle + Theme + Status */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2 sm:gap-3 z-10">
              {/* Theme switcher */}
              {showUI && (
                <button
                  aria-label="Toggle theme"
                  title="Toggle theme"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="relative inline-flex w-14 h-7 items-center rounded-full bg-muted/80 text-foreground border border-border shadow-sm cursor-pointer transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <span className="sr-only">Toggle theme</span>
                  <span
                    className={`size-6 rounded-full bg-background text-[11px] flex items-center justify-center shadow-sm transition-transform duration-300 ease-out ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`}
                  >
                    {theme === 'dark' ? '🌙' : '☀️'}
                  </span>
                </button>
              )}
              {/* UI Toggle */}
              <button
                onClick={() => setShowUI(!showUI)}
                className="inline-flex items-center justify-center size-7 rounded-full bg-muted/80 text-foreground border border-border shadow-sm cursor-pointer transition-all hover:bg-accent hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring/40"
                title={showUI ? 'Hide UI' : 'Show UI'}
              >
                <span className="text-[10px] leading-none">
                  {showUI ? '👁️' : '👁️‍🗨️'}
                </span>
              </button>
              {/* Calculators Button */}
              <button
                className="inline-flex items-center justify-center px-4 h-7 rounded-full bg-muted/80 text-foreground border border-border shadow-sm cursor-pointer transition-all hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/40 font-semibold text-sm"
                title="Open calculators"
                onClick={() => navigate('/calculators')}
              >
                Calculators
              </button>
            </div>

            {/* Connection status on extreme left */}
            {showUI && (
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2 z-10">
                <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
                <span className="text-xs sm:text-sm text-muted-foreground capitalize font-['Space Grotesk',_sans-serif]">
                  {connectionStatus}
                </span>
              </div>
            )}

            <div className="flex flex-col items-center justify-center relative size-full min-h-screen">
              <div className="w-full max-w-[90vw] md:max-w-[1200px] px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 flex flex-col items-center justify-center mx-auto">
                <div className="flex flex-col gap-6 sm:gap-8 items-center w-full">
                  {/* Pair and currency pill inline, centered with blocks on desktop */}
                  <div className="flex items-center gap-4 sm:gap-6 justify-center">
                    <div className="inline-flex items-center gap-2 bg-muted rounded-[28px] sm:rounded-[32px] lg:rounded-[44px] border border-border px-4 py-3 sm:px-5 sm:py-4 w-fit">
                      {(['BTC', 'ETH', 'SOL'] as const).map((crypto) => (
                        <button
                          key={crypto}
                          onClick={() => switchCrypto(crypto)}
                          className={`px-3 py-1.5 rounded-full text-sm sm:text-base font-bold transition-all duration-200 ${
                            selectedCrypto === crypto
                              ? 'bg-foreground text-background shadow-sm'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'
                          }`}
                        >
                          {crypto}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col justify-center whitespace-nowrap h-12 sm:h-14 md:h-16">
                      <div className="font-bold text-foreground leading-none tracking-[0.02em] text-[30px] sm:text-[36px] md:text-[40px]">{selectedCrypto}</div>
                      <div className="text-muted-foreground leading-none text-[18px] sm:text-[20px] md:text-[24px]">USDT</div>
                    </div>
                  </div>
                  {/* Blocks row + change label */}
                  <motion.div
                     className="relative flex flex-col md:flex-row gap-4 sm:gap-6 lg:gap-8 items-center justify-center w-full"
                    key={selectedCrypto}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    {isLoading || !currentPrice ? (
                      <PriceSkeleton 
                        blocks={selectedCrypto === 'SOL' ? 2 : 3} 
                        className="w-full price-container animate-fadeIn" 
                      />
                    ) : (
                      // Render actual price blocks - use only 2 blocks for SOL
                      <>
                        {/* For SOL (small integer), use 2-block layout */}
                        {selectedCrypto === 'SOL' || (!currentParts.left && currentParts.middle) ? (
                          <>
                            {/* Middle (integer) block */}
                            <div className="md:w-auto">
                              <PriceBlock 
                                value={currentParts.middle} 
                                previousValue={previousParts.middle} 
                              />
                            </div>
                            {/* Decimal block */}
                            <div className="md:w-auto">
                              <PriceBlock 
                                value={currentParts.right} 
                                previousValue={previousParts.right} 
                              />
                            </div>
                          </>
                        ) : (
                          // For BTC/ETH (large numbers), use 3-block layout
                          <>
                            <div className="md:w-auto">
                              <PriceBlock 
                                value={currentParts.left} 
                                previousValue={previousParts.left} 
                              />
                            </div>
                            <div className="md:w-auto">
                              <PriceBlock 
                                value={currentParts.middle} 
                                previousValue={previousParts.middle} 
                              />
                            </div>
                            <div className="md:w-auto">
                              <PriceBlock 
                                value={currentParts.right} 
                                previousValue={previousParts.right} 
                              />
                            </div>
                          </>
                        )}
                      </>
                    )}
                    <div className="hidden md:block absolute -bottom-6 right-2 text-sm font-['Space Grotesk',_sans-serif] pointer-events-none">
                      <span className={change10m >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                        {change10m >= 0 ? '+' : ''}{isFinite(change10m) ? change10m.toFixed(2) : '0.00'}% in 24h
                      </span>
                    </div>
                  </motion.div>
                  {/* Streak badge */}
                  {streak > 1 && (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-accent/60 text-accent-foreground border border-border px-3 py-1 text-base font-['Space Grotesk',_sans-serif]">
                      <span>🔥</span>
                      <span>
                        You've checked {selectedCrypto} price {streak} {streak === 1 ? 'day' : 'days'} in a row! <span className="opacity-70">Keep the streak alive.</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom-right: Typewriter footer */}
            {showUI && (
              <motion.div
                 className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 text-muted-foreground"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: footerDim ? 0.6 : 1, y: 0 }}
                transition={{
                  opacity: { duration: 0.9, ease: 'easeOut' },
                  y: { type: 'spring', stiffness: 220, damping: 24 }
                }}
              >
                <div className="text-[12px] sm:text-sm font-['Space Grotesk',_sans-serif] select-none max-w-[90vw] text-right whitespace-normal leading-tight">
                  <span>{footerPreText.slice(0, Math.min(footerTypedCount, footerPreText.length))}</span>
                  <a
                    className="underline decoration-dotted hover:decoration-solid hover:text-foreground transition-colors"
                    href="https://www.linkedin.com/in/aakarshraaj"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {footerTypedCount > footerPreText.length
                       ? footerLinkText.slice(0, footerTypedCount - footerPreText.length)
                       : ''}
                  </a>
                  {footerTypedCount < footerPreText.length + footerLinkText.length && (
                    <span className="ml-0.5 opacity-60 animate-pulse">|</span>
                  )}
                </div>
              </motion.div>
            )}

            {/* Additional Info Panel */}
            {showUI && (
              <motion.div
                 className="relative inline-flex flex-col w-fit max-w-[90vw] mx-4 mt-6 mb-[calc(env(safe-area-inset-bottom)+72px)] sm:mx-0 sm:mt-0 sm:mb-0 sm:fixed sm:left-8 sm:right-auto sm:bottom-8 bg-card rounded-xl sm:rounded-2xl shadow-md p-3 sm:p-4 border border-border sm:max-w-[360px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <div className="font-bold text-xs sm:text-sm mb-1.5 sm:mb-2">
                  Live Data
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground space-y-1">
                  <div>Volume: {isFinite(volume) ? volume.toFixed(6) : '0.000000'} {selectedCrypto}</div>
                  <div>Change: {isFinite(change10m) ? change10m.toFixed(4) : '0.0000'}%</div>
                  <div>Source: {selectedCrypto}/USDT WebSocket</div>
                  <div>Last Updated: {Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 1000))}s ago</div>
                </div>
              </motion.div>
            )}

            {/* Resume Audio Button (for debugging) */}
            <button onClick={async () => { if (audioCtxRef.current) { await audioCtxRef.current.resume().catch(()=>{}); console.log('Audio resumed') } }}>
              Resume Audio
            </button>
          </div>
        } />
  <Route path="/calculators" element={<Calculators onCalculatorClick={(slug) => navigate(`/calculators/${slug}`)} onHomeClick={() => navigate('/')} />} />
      </Routes>
    </BrowserRouter>
  )
 }