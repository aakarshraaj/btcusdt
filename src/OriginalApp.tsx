import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useCrypto } from './context/CryptoContext'

export default function App() {
  const navigate = useNavigate()
  
  // Use shared crypto context instead of local state
  const { currentPrice, previousPrice, selectedCrypto, connectionStatus, isSwitchingCrypto, setSelectedCrypto } = useCrypto()
  
  const [volume, setVolume] = useState(0.12345)
  const [previousVolume, setPreviousVolume] = useState(0.12345)

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
  
  // Multi-crypto support
  const SUPPORTED_CRYPTOS = ['BTC', 'ETH', 'SOL'] as const
  type SupportedCrypto = typeof SUPPORTED_CRYPTOS[number]
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    if (saved === 'light' || saved === 'dark') return saved
    return 'light'
  })

  // Function to switch cryptocurrencies with local state reset
  const switchCrypto = (crypto: SupportedCrypto) => {
    // Reset local volume data when switching
    setVolume(0)
    setChange10m(0)
    
    // Clear price history and refs to prevent false beeping
    priceHistoryRef.current = []
    lastPriceRef.current = 0
    lastVolumeRef.current = 0
    
    // Reset audio timing refs to prevent false triggers
    lastTingUpRef.current = 0
    lastTingDownRef.current = 0
    lastHeadlineRef.current = 0
    
    // Use context's switching function which handles WebSocket and state management
    setSelectedCrypto(crypto)
  }

  // Effect to update local refs when price changes from context
  useEffect(() => {
    lastPriceRef.current = currentPrice
  }, [currentPrice])

  // Effect to handle price change monitoring and audio triggers
  useEffect(() => {
    if (!currentPrice || currentPrice <= 0 || isSwitchingCrypto) return
    
    const oldPrice = lastPriceRef.current
    if (!oldPrice || oldPrice <= 0) return

    // Only calculate % if both old & new are valid
    const priceChange = ((currentPrice - oldPrice) / oldPrice) * 100
    if (Math.abs(priceChange) >= 5) {
      const now = Date.now()
      const cooldown = 30_000
      if (priceChange >= 5 && now - lastTingUpRef.current > cooldown) {
        lastTingUpRef.current = now
        playPing(1200)
      } else if (priceChange <= -5 && now - lastTingDownRef.current > cooldown) {
        lastTingDownRef.current = now
        playPing(520)
      }
    }

    // Update history for 10m change
    const now = Date.now()
    priceHistoryRef.current.push({ ts: now, price: currentPrice })
    const tenMinAgo = now - 10 * 60 * 1000
    while (priceHistoryRef.current.length && priceHistoryRef.current[0].ts < tenMinAgo) {
      priceHistoryRef.current.shift()
    }
    const first = priceHistoryRef.current[0]?.price
    if (first) {
      const change = ((currentPrice - first) / first) * 100
      setChange10m(change)
      // Play tings on threshold crossing with 30s cooldown per direction
      if (!isSwitchingCrypto) {
        const cooldown = 30_000
        if (change >= 2 && now - lastTingUpRef.current > cooldown) {
          lastTingUpRef.current = now
          playPing(1200)
        } else if (change <= -2 && now - lastTingDownRef.current > cooldown) {
          lastTingDownRef.current = now
          playPing(520)
        }
      }
    }
  }, [currentPrice, isSwitchingCrypto])

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

  /* Added safe formatter to avoid calling toFixed on null/undefined */
  function formatPriceSafe(value?: number | null) {
    if (value === null || value === undefined || !isFinite(value) || value <= 0) return "0.00";
    return value.toFixed(2);
  }

  // Format price into segments with dynamic slicing for correct thousands separator
  const formatPrice = (price: number) => {
    const priceStr = price.toFixed(2)
    const parts = priceStr.split('.')
    const integerPart = parts[0]
    const decimalPart = `.${parts[1]}`
    
    // Dynamic slicing based on number of digits
    const digitCount = integerPart.length
    
    if (digitCount >= 6) {
      // 6+ digits: first 3, middle 3, decimal (e.g., BTC: 115,990.55 → "115—990—.55")
      const first = integerPart.slice(0, 3)
      const middle = integerPart.slice(3, 6)
      return { first, middle, decimal: decimalPart }
    } else if (digitCount >= 4) {
      // 4-5 digits: first 1-2, middle 3, decimal (e.g., ETH: 4,990.44 → "4—990—.44")
      const first = integerPart.slice(0, digitCount - 3)
      const middle = integerPart.slice(digitCount - 3)
      return { first, middle, decimal: decimalPart }
    } else {
      // 1-3 digits: all digits, no middle, decimal (e.g., SOL: 202.23 → "202—.23")
      return { first: integerPart, middle: '', decimal: decimalPart }
    }
  }

  const currentParts = formatPrice(currentPrice)
  const previousParts = formatPrice(previousPrice)

  // Show headline + audio ping when the first (thousands) block changes
  useEffect(() => {
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
      if (value !== previousValue) {
        const numCurrent = parseFloat(value.replace(/[^0-9.-]/g, ''))
        const numPrevious = parseFloat(previousValue.replace(/[^0-9.-]/g, ''))

        // Reset to base first so repeated moves in same direction still flash
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
    }, [value, previousValue])

    return (
      <div 
        className={`${bgColor} box-border inline-flex items-center justify-center relative shrink-0 transition-colors duration-500 ease-out border border-border rounded-[28px] sm:rounded-[32px] lg:rounded-[44px] p-4 sm:p-6 md:p-8 lg:p-10`}
      >
        <div className="font-['Space Grotesk',_sans-serif] font-bold leading-[0] relative shrink-0 text-foreground text-[clamp(80px,18vw,112px)] sm:text-[112px] md:text-[128px] lg:text-[160px] xl:text-[192px] text-nowrap">
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
      {/* Top bar: Theme + Calculators on the right */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2 sm:gap-3 z-10">
        {/* Calculators button */}
        <motion.button
          onClick={() => navigate('/calculators')}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Calculators
        </motion.button>

        {/* Theme switcher (modern toggle) */}
        <button
          aria-label="Toggle theme"
          title="Toggle theme"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="relative inline-flex w-14 h-7 items-center rounded-full bg-muted/80 text-foreground border border-border shadow-sm cursor-pointer transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <span className="sr-only">Toggle theme</span>
          <span
            className={`size-6 rounded-full bg-background text-[11px] inline-flex items-center justify-center shadow-sm transition-transform duration-300 ease-out ml-0.5 ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`}
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </span>
        </button>
      </div>

      {/* Connection status moved to top-left */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2 z-10">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
        <span className="text-xs sm:text-sm text-muted-foreground capitalize font-['Space Grotesk',_sans-serif]">
          {connectionStatus}
        </span>
      </div>

      {/* Crypto Switcher in the center top */}
      <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10">
        <div className="inline-flex items-center gap-1 bg-black/85 text-white rounded-xl p-1 shadow-lg border border-white/10">
          {SUPPORTED_CRYPTOS.map((crypto) => (
            <button
              key={crypto}
              onClick={() => switchCrypto(crypto)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                selectedCrypto === crypto
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white hover:bg-white/10'
              }`}
              aria-pressed={selectedCrypto === crypto}
            >
              {crypto}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center relative size-full min-h-screen">
        <div className="w-full max-w-[560px] md:max-w-[1100px] px-5 sm:px-6 md:px-8 py-12 sm:py-16 md:py-0 flex md:h-screen md:items-center md:justify-center mx-auto">
          <div className="flex flex-col gap-4 items-start md:items-start w-full">
            {/* Pair and currency pill inline, centered with blocks on desktop */}
            <div className="flex items-start gap-4 sm:gap-6 self-start md:self-start lg:-ml-6">
              <div className="inline-flex items-center gap-3 bg-muted rounded-[28px] sm:rounded-[32px] lg:rounded-[44px] border border-border px-4 py-3 sm:px-5 sm:py-4 w-fit md:mt-1 origin-left">
                <div className="size-10 sm:size-12 md:size-14 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center shadow-sm">
                  <span className="text-[16px] sm:text-[18px] md:text-[20px] leading-none">
                    {selectedCrypto === 'BTC' ? '₿' : selectedCrypto === 'ETH' ? 'Ξ' : '◎'}
                  </span>
                </div>
                <div className="font-['Space Grotesk',_sans-serif] text-foreground text-[28px] sm:text-[28px] md:text-[32px] leading-none">$</div>
              </div>
              <div className="mt-0.5 self-start flex flex-col justify-between whitespace-nowrap h-12 sm:h-14 md:h-16">
                <div className="font-bold text-foreground leading-none tracking-[0.02em] text-[30px] sm:text-[36px] md:text-[40px]">{selectedCrypto}</div>
                <div className="text-muted-foreground leading-none text-[18px] sm:text-[20px] md:text-[24px]">USDT</div>
              </div>
            </div>

            {/* Blocks row + change label */}
            <div className="relative inline-flex flex-col md:flex-row gap-3 sm:gap-4 lg:gap-6 md:items-start md:justify-start lg:-ml-6 w-full sm:w-auto">
              <div className="md:w-auto"><PriceBlock value={currentParts.first} previousValue={previousParts.first} /></div>
              {currentParts.middle && (
                <div className="md:w-auto"><PriceBlock value={currentParts.middle} previousValue={previousParts.middle} /></div>
              )}
              <div className="md:w-auto"><PriceBlock value={currentParts.decimal} previousValue={previousParts.decimal} /></div>
              <div className="hidden md:block absolute -bottom-6 right-2 text-sm font-['Space Grotesk',_sans-serif] pointer-events-none">
                <span className={change10m >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                  {change10m >= 0 ? '+' : ''}{change10m.toFixed(2)}% in 10 mins
                </span>
              </div>
            </div>

            {/* Streak badge */}
            {streak > 1 && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-accent/60 text-accent-foreground border border-border px-3 py-1 text-base font-['Space Grotesk',_sans-serif]">
                <span>🔥</span>
                <span>
                  You’ve checked BTC price {streak} {streak === 1 ? 'day' : 'days'} in a row! <span className="opacity-70">Keep the streak alive.</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom-right: LinkedIn link */}
      {/* Bottom-right: Typewriter footer */}
      <motion.div 
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+12px)] sm:bottom-6 sm:right-6 z-20 text-muted-foreground"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: footerDim ? 0.65 : 1, y: 0 }}
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

      {/* Additional Info Panel */}
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
          <div>Volume: {volume.toFixed(6)} BTC</div>
          <div>Change: {((currentPrice - previousPrice) / previousPrice * 100).toFixed(4)}%</div>
          <div>Source: Binance WebSocket</div>
        </div>
      </motion.div>
    </div>
  )
}