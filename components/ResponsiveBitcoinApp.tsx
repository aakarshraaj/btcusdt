import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'

interface ResponsiveBitcoinAppProps {
  className?: string
}

export default function ResponsiveBitcoinApp({ className = '' }: ResponsiveBitcoinAppProps) {
  const [currentPrice, setCurrentPrice] = useState(115055.31)
  const [previousPrice, setPreviousPrice] = useState(115055.31)
  const [volume, setVolume] = useState(0.12345)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade')
      wsRef.current = ws

      ws.onopen = () => {
        setConnectionStatus('connected')
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const newPrice = parseFloat(data.p)
          const newVolume = parseFloat(data.q)

          setPreviousPrice(currentPrice)
          setCurrentPrice(newPrice)
          setVolume(newVolume)
        } catch (error) {
          console.error('Error parsing WebSocket data:', error)
        }
      }

      ws.onclose = () => {
        setConnectionStatus('disconnected')
        reconnectTimeoutRef.current = setTimeout(() => {
          setConnectionStatus('connecting')
          connectWebSocket()
        }, 3000)
      }

      ws.onerror = () => {
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      setConnectionStatus('disconnected')
    }
  }

  useEffect(() => {
    connectWebSocket()
    return () => {
      if (wsRef.current) wsRef.current.close()
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
    }
  }, [])

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

  const getFlashColor = (current: string, previous: string) => {
    const numCurrent = parseFloat(current.replace(/[^0-9.-]/g, ''))
    const numPrevious = parseFloat(previous.replace(/[^0-9.-]/g, ''))
    
    if (numCurrent > numPrevious) return 'bg-green-200'
    if (numCurrent < numPrevious) return 'bg-red-200'
    return 'bg-[#dedede]'
  }

  const PriceBlock = ({ value, previousValue }: { value: string, previousValue: string }) => {
    const [flashColor, setFlashColor] = useState('bg-[#dedede]')
    
    useEffect(() => {
      if (value !== previousValue) {
        const newColor = getFlashColor(value, previousValue)
        setFlashColor(newColor)
        
        const timer = setTimeout(() => {
          setFlashColor('bg-[#dedede]')
        }, 2000)
        
        return () => clearTimeout(timer)
      }
    }, [value, previousValue])

    return (
      <motion.div 
        className={`${flashColor} box-border content-stretch flex gap-2.5 items-center justify-center p-[12px] sm:p-[24px] relative rounded-2xl shrink-0 transition-colors duration-300`}
        animate={{ scale: flashColor !== 'bg-[#dedede]' ? 1.05 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="font-['Space_Grotesk:Bold',_sans-serif] font-bold leading-[0] relative shrink-0 text-[#000000] text-[48px] sm:text-[96px] text-nowrap">
          <p className="block leading-[normal] whitespace-pre">{value}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className={`bg-[#ffffff] relative w-full min-h-screen ${className}`}>
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <div className={`w-3 h-3 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-500' :
          connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
        }`}></div>
        <span className="text-sm text-gray-600 capitalize font-['Space_Grotesk:Regular',_sans-serif]">
          {connectionStatus}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center relative w-full min-h-screen px-4 sm:px-[461px] py-8 sm:py-[341px]">
        <div className="box-border content-stretch flex flex-col gap-3.5 items-start justify-start p-0 relative shrink-0 w-full max-w-4xl">
          <div className="font-['Space_Grotesk:Bold',_sans-serif] font-bold leading-[0] relative shrink-0 text-[#000000] text-[18px] sm:text-[24px] w-full text-center sm:text-left">
            <p className="block leading-[normal]">Current Price (USD)</p>
          </div>
          
          <div className="box-border content-stretch flex flex-wrap sm:flex-nowrap gap-2 items-start justify-center sm:justify-start p-0 relative shrink-0 w-full">
            <motion.div 
              className="bg-[#dedede] box-border content-stretch flex gap-1 items-center justify-center p-[8px] relative rounded-lg shrink-0"
              animate={{
                backgroundColor: connectionStatus === 'connected' ? '#dedede' : 
                                connectionStatus === 'connecting' ? '#fef3c7' : '#fee2e2'
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="font-['Space_Grotesk:Regular',_sans-serif] font-normal leading-[0] relative shrink-0 text-[#000000] text-[24px] text-nowrap">
                <p className="block leading-[normal] whitespace-pre">$</p>
              </div>
            </motion.div>
            
            <PriceBlock value={currentParts.first} previousValue={previousParts.first} />
            <PriceBlock value={currentParts.middle} previousValue={previousParts.middle} />
            <PriceBlock value={currentParts.decimal} previousValue={previousParts.decimal} />
          </div>
        </div>
      </div>

      <motion.div 
        className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg p-3 border border-gray-200 text-xs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="font-['Space_Grotesk:Bold',_sans-serif] text-black mb-1">Live Data</div>
        <div className="font-['Space_Grotesk:Regular',_sans-serif] text-gray-600 space-y-0.5">
          <div>Vol: {volume.toFixed(6)} BTC</div>
          <div>Δ: {((currentPrice - previousPrice) / previousPrice * 100).toFixed(4)}%</div>
        </div>
      </motion.div>
    </div>
  )
}