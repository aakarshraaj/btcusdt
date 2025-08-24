import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
// If the file exists at src/pages/calculators.tsx, keep as is.
// Otherwise, update the path to the correct location, for example:
// import Calculators from './Calculators'; // If located at src/Calculators.tsx
import Calculators from '../pages/calculators'; // If located at src/pages/calculators.tsx

export default function App() {
  const [currentPrice, setCurrentPrice] = useState(115055.31)
  const [previousPrice, setPreviousPrice] = useState(115055.31)
  const [volume, setVolume] = useState(0.12345)
  const [previousVolume, setPreviousVolume] = useState(0.12345)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  const wsRef = useRef<WebSocketWithMetadata | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastPriceRef = useRef<number>(currentPrice)
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
    symbol?: string
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
  
  // INDIVIDUAL WEBSOCKET CONNECTIONS - CONNECTION-ID DRIVEN (NO RACE CONDITIONS)
  const connectWebSocket = (symbol: 'BTC' | 'ETH' | 'SOL') => {
    try {
      // Close any existing connection first
      if (wsRef.current) {
        console.log(`🔌 Closing existing connection for ${wsRef.current.symbol}`)
        wsRef.current.close()
        wsRef.current = null
      }
      
      // Clear active connection state
      setActiveConnection(null)
      setConnectionStatus('connecting')
      
      // Create unique connection ID for this socket
      const connectionId = Date.now()
      
      // Create individual WebSocket for the specific cryptocurrency
      const symbolLower = symbol.toLowerCase()
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbolLower}usdt@ticker`) as WebSocketWithMetadata
      
      // Store connection metadata directly on the WebSocket
      ws.connectionId = connectionId
      ws.symbol = symbol
      
      console.log(`🚀 Creating NEW WebSocket for ${symbol}/USDT (ID: ${connectionId})`)
      
      // Store connection reference
      wsRef.current = ws
      
      ws.onopen = () => {
        // Check if this is still the current connection
        if (ws.connectionId !== connectionId) return // stale connection
        console.log(`✅ WebSocket OPENED for ${symbol}/USDT (ID: ${connectionId})`)
        setConnectionStatus('connected')
        setActiveConnection(symbol)
      }
      
      ws.onmessage = (event) => {
        // Check if this is still the current connection
        if (ws.connectionId !== connectionId) return // stale connection, ignore
        
        try {
          const data = JSON.parse(event.data)
          const newPrice = parseFloat(data.c) // ✅ last price from ticker
          const newVolume = parseFloat(data.v) // ✅ base asset volume from ticker
          
          if (!newPrice || isNaN(newPrice)) return
          
          console.log(`📊 VALID ${symbol}/USDT data: $${newPrice}, Volume: ${newVolume} (ID: ${connectionId})`)
          
          // Ensure connection status is set to connected when data is flowing
          if (connectionStatus !== 'connected') {
            setConnectionStatus('connected')
          }
          
          // Use refs for accurate price change calculation (no race conditions)
          const oldPrice = lastPriceRef.current
          lastPriceRef.current = newPrice
          
          // Update state immediately - no race conditions
          setPreviousPrice(oldPrice)
          setCurrentPrice(newPrice)
          setVolume(newVolume)
          setLastUpdated(new Date())
          
          // Store last values for next comparison
          lastVolumeRef.current = newVolume
          
          // Only calculate price change if not switching and both old & new are valid
          if (!isSwitchingCrypto && oldPrice > 0) {
            const priceChange = ((newPrice - oldPrice) / oldPrice) * 100
            console.log(`📈 Price change: ${priceChange.toFixed(2)}%`)
            
            // Only trigger audio on significant changes (5% or more)
            if (Math.abs(priceChange) >= 5) {
              const now = Date.now()
              const cooldown = 30_000
              
              if (priceChange >= 5 && now - lastTingUpRef.current > cooldown) {
                lastTingUpRef.current = now
                playPing(1200)
                console.log(`🔊 UP sound for ${symbol}: +${priceChange.toFixed(2)}%`)
              } else if (priceChange <= -5 && now - lastTingDownRef.current > cooldown) {
                lastTingDownRef.current = now
                playPing(520)
                console.log(`🔊 DOWN sound for ${symbol}: ${priceChange.toFixed(2)}%`)
              }
            }
          }
        } catch (error) {
          console.error(`❌ Parse error for ${symbol}:`, error)
        }
      }
      
      ws.onclose = () => {
        // Check if this is still the current connection
        if (ws.connectionId !== connectionId) return // stale connection
        console.log(`🔌 WebSocket CLOSED for ${symbol}/USDT (ID: ${connectionId})`)
        
        // Only set disconnected if this was the active connection AND no new connection is active
        if (activeConnection === symbol) {
          setActiveConnection(null)
          setConnectionStatus('disconnected')
        }
      }
      
      ws.onerror = (error) => {
        // Check if this is still the current connection
        if (ws.connectionId !== connectionId) return // stale connection
        console.error(`❌ WebSocket error for ${symbol}/USDT (ID: ${connectionId}):`, error)
        
        // Only set disconnected if this was the active connection AND no new connection is active
        if (activeConnection === symbol) {
          setActiveConnection(null)
          setConnectionStatus('disconnected')
        }
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
    
    // Reset state for new cryptocurrency
    setCurrentPrice(0)
    setPreviousPrice(0)
    setVolume(0)
    setChange10m(0)
    setLastUpdated(new Date())
    
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

  // Format price into segments based on crypto price range - FIXED
  const formatPrice = (price: number) => {
    console.log(`🔍 FORMAT DEBUG:`, {
      price: price,
      selectedCrypto: selectedCrypto,
      priceType: typeof price
    })
    
    if (!price || price <= 0) return { first: '0', middle: '0', decimal: '.00' }
    
    const priceStr = price.toFixed(2)
    const parts = priceStr.split('.')
    const integerPart = parts[0]
    const decimalPart = `.${parts[1]}`
    
    // For prices < 1000, use 2 blocks (e.g., SOL: 145.23 -> [145, .23])
    if (price < 1000) {
      const result = { first: integerPart, middle: decimalPart, decimal: '' }
      console.log(`🔍 2-BLOCK FORMAT:`, result)
      return result
    }
    
    // For prices >= 1000, use 3 blocks with proper splitting
    if (integerPart.length <= 3) {
      // 3 digits or less (e.g., 999 -> [999, 000, .00])
      const result = { first: integerPart, middle: '000', decimal: decimalPart }
      console.log(`🔍 3-BLOCK FORMAT (short):`, result)
      return result
    } else {
      // More than 3 digits - split from right to left
      const first = integerPart.slice(0, -3) || '0'  // Everything except last 3 digits
      const middle = integerPart.slice(-3)            // Last 3 digits
      const result = { first, middle, decimal: decimalPart }
      console.log(`🔍 3-BLOCK FORMAT (long):`, result)
      return result
    }
  }

  const currentParts = formatPrice(currentPrice)
  const previousParts = formatPrice(previousPrice)

  // Only format price if it matches the selected cryptocurrency
  const shouldFormatPrice = currentPrice > 0 && selectedCrypto
  const displayParts = shouldFormatPrice ? currentParts : { first: '0', middle: '0', decimal: '.00' }

  // Debug logging
  console.log(`Selected: ${selectedCrypto}, Price: ${currentPrice}, Parts:`, currentParts)
  console.log(`Display Parts:`, displayParts)
  console.log(`First: "${displayParts.first}", Middle: "${displayParts.middle}", Decimal: "${displayParts.decimal}"`)

  // Show headline + audio ping when the first (thousands) block changes
  useEffect(() => {
    // Guard against crypto switching and invalid price history
    if (isSwitchingCrypto) return
    if (!previousPrice || previousPrice <= 0) return
    
    const firstNow = currentParts.first
    const firstPrev = previousParts.first
    if (firstNow === firstPrev) return
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
        className={`${bgColor} box-border inline-flex items-center justify-center relative shrink-0 transition-colors duration-500 ease-out border border-border rounded-[28px] sm:rounded-[32px] lg:rounded-[44px] p-6 sm:p-8 md:p-10 lg:p-12 xl:p-16 h-[clamp(80px,18vw,120px)] sm:h-[120px] md:h-[140px] lg:h-[160px] xl:h-[180px]`}
      >
        <div className="font-['Space Grotesk',_sans-serif] font-bold leading-[0] relative shrink-0 text-foreground text-nowrap min-h-[clamp(80px,18vw,120px)] sm:min-h-[120px] md:min-h-[140px] lg:min-h-[160px] xl:min-h-[180px] flex items-center justify-center">
          <p className="block leading-[normal] whitespace-pre text-[clamp(60px,16vw,96px)] sm:text-[96px] md:text-[112px] lg:text-[128px] xl:text-[144px]">{value || '0'}</p>
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
                    {connectionStatus === 'connecting' ? (
                      <>
                        <div className="md:w-auto mr-2 sm:mr-3 md:mr-4 lg:mr-6">
                          <div className="h-[clamp(80px,18vw,120px)] sm:h-[120px] md:h-[140px] lg:h-[160px] xl:h-[180px] bg-muted/60 border border-border rounded-[28px] sm:rounded-[32px] lg:rounded-[44px] animate-pulse flex items-center justify-center p-6 sm:p-8 md:p-10 lg:p-12 xl:p-16">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 bg-muted-foreground/20 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                        <div className="md:w-auto mr-2 sm:mr-3 md:mr-4 lg:mr-6">
                          <div className="h-[clamp(80px,18vw,120px)] sm:h-[120px] md:h-[140px] lg:h-[160px] xl:h-[180px] bg-muted/60 border border-border rounded-[28px] sm:rounded-[32px] lg:rounded-[44px] animate-pulse flex items-center justify-center p-6 sm:p-8 md:p-10 lg:p-12 xl:p-16">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 bg-muted-foreground/20 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                        {(selectedCrypto === 'ETH' || selectedCrypto === 'BTC') && (
                          <div className="md:w-auto">
                            <div className="h-[clamp(80px,18vw,120px)] sm:h-[120px] md:h-[140px] lg:h-[160px] xl:h-[180px] bg-muted/60 border border-border rounded-[28px] sm:rounded-[32px] lg:rounded-[44px] animate-pulse flex items-center justify-center p-6 sm:p-8 md:p-10 lg:p-12 xl:p-16">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 bg-muted-foreground/20 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="md:w-auto mr-2 sm:mr-3 md:mr-4 lg:mr-6"><PriceBlock value={displayParts.first} previousValue={previousParts.first} /></div>
                        <div className="md:w-auto mr-2 sm:mr-3 md:mr-4 lg:mr-6"><PriceBlock value={displayParts.middle} previousValue={previousParts.middle} /></div>
                        {displayParts.decimal && (
                          <div className="md:w-auto"><PriceBlock value={displayParts.decimal} previousValue={previousParts.decimal} /></div>
                        )}
                      </>
                    )}
                    <div className="hidden md:block absolute -bottom-6 right-2 text-sm font-['Space Grotesk',_sans-serif] pointer-events-none">
                      <span className={change10m >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                        {change10m >= 0 ? '+' : ''}{change10m.toFixed(2)}% in 24h
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
                  <div>Volume: {volume.toFixed(6)} {selectedCrypto}</div>
                  <div>Change: {change10m.toFixed(4)}%</div>
                  <div>Source: {selectedCrypto}/USDT WebSocket</div>
                  <div>Last Updated: {Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 1000))}s ago</div>
                </div>
              </motion.div>
            )}


          </div>
        } />
        <Route path="/calculators" element={<Calculators />} />
      </Routes>
    </BrowserRouter>
  )
 }