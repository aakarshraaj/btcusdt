import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'

export default function App() {
  const [currentPrice, setCurrentPrice] = useState(115055.31)
  const [previousPrice, setPreviousPrice] = useState(115055.31)
  const [volume, setVolume] = useState(0.12345)
  const [previousVolume, setPreviousVolume] = useState(0.12345)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastPriceRef = useRef<number>(currentPrice)
  const lastVolumeRef = useRef<number>(volume)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const lastHeadlineRef = useRef<number>(0)
  const [showHeadline, setShowHeadline] = useState(false)
  const [headlineText, setHeadlineText] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    if (saved === 'light' || saved === 'dark') return saved
    return 'light'
  })

  // WebSocket connection logic
  const connectWebSocket = () => {
    try {
      const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade')
      wsRef.current = ws

      ws.onopen = () => {
        console.log('Connected to Binance WebSocket')
        setConnectionStatus('connected')
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const newPrice = parseFloat(data.p)
          const newVolume = parseFloat(data.q)

          const lastPrice = lastPriceRef.current
          const lastVol = lastVolumeRef.current

          setPreviousPrice(lastPrice)
          setCurrentPrice(newPrice)
          setPreviousVolume(lastVol)
          setVolume(newVolume)

          lastPriceRef.current = newPrice
          lastVolumeRef.current = newVolume
        } catch (error) {
          console.error('Error parsing WebSocket data:', error)
        }
      }

      ws.onclose = () => {
        console.log('WebSocket connection closed')
        setConnectionStatus('disconnected')
        
        reconnectTimeoutRef.current = setTimeout(() => {
          setConnectionStatus('connecting')
          connectWebSocket()
        }, 3000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      console.error('Error connecting to WebSocket:', error)
      setConnectionStatus('disconnected')
    }
  }

  useEffect(() => {
    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
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

  // Format price into segments (3 blocks)
  const formatPrice = (price: number) => {
    const priceStr = price.toFixed(2)
    const parts = priceStr.split('.')
    const integerPart = parts[0]
    const firstThree = integerPart.slice(0, 3)
    const middleDigits = integerPart.slice(3).padStart(3, '0')
    const decimalPart = `.${parts[1]}`
    return { first: firstThree, middle: middleDigits, decimal: decimalPart }
  }

  const currentParts = formatPrice(currentPrice)
  const previousParts = formatPrice(previousPrice)

  // Show headline + audio ping when the first (thousands) block changes
  useEffect(() => {
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
  }, [currentPrice, previousPrice])

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
      if (value !== previousValue) {
        const numCurrent = parseFloat(value.replace(/[^0-9.-]/g, ''))
        const numPrevious = parseFloat(previousValue.replace(/[^0-9.-]/g, ''))
        
        if (numCurrent > numPrevious) {
          setBgColor('bg-emerald-300/40 dark:bg-emerald-500/20')
        } else if (numCurrent < numPrevious) {
          setBgColor('bg-rose-300/40 dark:bg-rose-500/20')
        }
        
        const timer = setTimeout(() => {
          setBgColor('bg-muted')
        }, 2000)
        
        return () => clearTimeout(timer)
      }
    }, [value, previousValue])

    return (
      <div 
        className={`${bgColor} box-border content-stretch flex gap-2.5 items-center justify-center p-[24px] relative rounded-[3rem] shrink-0 transition-colors duration-500 ease-out border border-border`}
      >
        <div className="font-['Space Grotesk',_sans-serif] font-bold leading-[0] relative shrink-0 text-foreground text-[96px] text-nowrap">
          <p className="block leading-[normal] whitespace-pre">{value}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground relative size-full min-h-screen">
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
      {/* Top bar: Theme + Status */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
        {/* Theme switcher */}
        <button
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="group relative inline-flex items-center h-7 rounded-full px-2 bg-muted text-foreground border border-border transition-colors"
        >
          <span className="sr-only">Toggle theme</span>
          <span className="text-[10px] mr-1">{theme === 'dark' ? '🌙' : '☀️'}</span>
          <span className="text-[10px] capitalize opacity-70 group-hover:opacity-100">{theme}</span>
        </button>

        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
        <span className="text-sm text-muted-foreground capitalize font-['Space Grotesk',_sans-serif]">
          {connectionStatus}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-col gap-2.5 items-center justify-center px-[461px] py-[341px] relative size-full">
          <div className="box-border content-stretch flex flex-col gap-3.5 items-start justify-start p-0 relative shrink-0">
            <div className="font-bold leading-[0] relative shrink-0 text-foreground/90 text-[24px] w-full">
              <p className="block leading-[normal]">Current Price (USD)</p>
            </div>
            <div className="box-border content-stretch flex gap-2 items-start justify-start p-0 relative shrink-0 w-full">
              {/* Dollar frame (no external asset) */}
              <div 
                className="bg-muted box-border content-stretch flex items-center justify-center gap-2 p-[10px] relative rounded-3xl shrink-0 border border-border"
              >
                <div className="size-8 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center shadow-sm">
                  <span className="text-[14px] leading-none">₿</span>
                </div>
                <div className="font-['Space Grotesk',_sans-serif] font-normal leading-[0] relative shrink-0 text-foreground text-[24px] text-nowrap">
                  <p className="block leading-[normal] whitespace-pre">$</p>
                </div>
              </div>

              {/* Three animated blocks */}
              <PriceBlock value={currentParts.first} previousValue={previousParts.first} />
              <PriceBlock value={currentParts.middle} previousValue={previousParts.middle} />
              <PriceBlock value={currentParts.decimal} previousValue={previousParts.decimal} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom-right: LinkedIn link */}
      <motion.a
        href="https://www.linkedin.com/in/aakarshraaj"
        aria-label="LinkedIn profile of aakarshraaj"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-8 right-8 bg-card rounded-3xl shadow-lg px-3 py-2 border border-border flex items-center gap-2 text-xs text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        <div className="size-5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center">
          <span className="text-[10px] leading-none">in</span>
        </div>
        <span>@aakarshraaj</span>
      </motion.a>

      {/* Additional Info Panel */}
      <motion.div 
        className="absolute bottom-8 left-8 bg-card rounded-3xl shadow-lg p-4 border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="font-bold text-sm mb-2">
          Live Data
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Volume: {volume.toFixed(6)} BTC</div>
          <div>Change: {((currentPrice - previousPrice) / previousPrice * 100).toFixed(4)}%</div>
          <div>Source: Binance WebSocket</div>
        </div>
      </motion.div>
    </div>
  )
}