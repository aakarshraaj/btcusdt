import { motion } from 'motion/react'
import { useState, useEffect } from 'react'

interface VolumeTickerProps {
  volume: number
  previousVolume: number
}

export default function VolumeTicker({ volume, previousVolume }: VolumeTickerProps) {
  const [isFlashing, setIsFlashing] = useState(false)
  
  useEffect(() => {
    if (volume !== previousVolume) {
      setIsFlashing(true)
      const timer = setTimeout(() => setIsFlashing(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [volume, previousVolume])
  
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) {
      return `${(vol / 1000000).toFixed(2)}M`
    } else if (vol >= 1000) {
      return `${(vol / 1000).toFixed(2)}K`
    }
    return vol.toFixed(4)
  }
  
  const isVolumeUp = volume > previousVolume
  
  return (
    <motion.div 
      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-300 ${
        isFlashing 
          ? isVolumeUp 
            ? 'bg-green-100 border border-green-200' 
            : 'bg-red-100 border border-red-200'
          : 'bg-gray-50 border border-gray-200'
      }`}
      animate={{ scale: isFlashing ? 1.02 : 1 }}
    >
      <div className="text-xs text-gray-500">Volume</div>
      <div className="text-sm font-mono">
        {formatVolume(volume)} BTC
      </div>
      {isFlashing && (
        <motion.div
          className={`w-2 h-2 rounded-full ${isVolumeUp ? 'bg-green-500' : 'bg-red-500'}`}
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 0.5 }}
        />
      )}
    </motion.div>
  )
}