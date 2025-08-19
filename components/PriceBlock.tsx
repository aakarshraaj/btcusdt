import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

interface PriceBlockProps {
  value: string
  previousValue: string
  label?: string
}

export default function PriceBlock({ value, previousValue, label }: PriceBlockProps) {
  const [flashColor, setFlashColor] = useState('bg-gray-200')
  
  useEffect(() => {
    if (value !== previousValue) {
      const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''))
      const numPrevious = parseFloat(previousValue.replace(/[^0-9.-]/g, ''))
      
      if (numValue > numPrevious) {
        setFlashColor('bg-green-200')
      } else if (numValue < numPrevious) {
        setFlashColor('bg-red-200')
      } else {
        setFlashColor('bg-gray-200')
      }
      
      // Fade back to neutral after 2 seconds
      const timer = setTimeout(() => {
        setFlashColor('bg-gray-200')
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [value, previousValue])
  
  return (
    <motion.div
      className={`${flashColor} rounded-lg px-4 py-3 transition-all duration-300 border border-gray-300`}
      animate={{
        scale: flashColor !== 'bg-gray-200' ? 1.05 : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      {label && (
        <div className="text-xs text-gray-500 mb-1">{label}</div>
      )}
      <div className="text-2xl font-mono font-medium text-gray-900">
        {value}
      </div>
    </motion.div>
  )
}