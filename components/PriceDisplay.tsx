import { motion } from 'motion/react'
import PriceBlock from './PriceBlock'

interface PriceDisplayProps {
  price: number
  previousPrice: number
}

export default function PriceDisplay({ price, previousPrice }: PriceDisplayProps) {
  const formatPrice = (price: number) => {
    const priceStr = price.toFixed(2)
    const parts = priceStr.split('.')
    const integerPart = parts[0]
    
    // Split integer part: first 3 digits, then middle digits
    const firstThree = integerPart.slice(0, 3)
    const middleDigits = integerPart.slice(3)
    const decimalPart = `.${parts[1]}`
    
    return {
      first: firstThree,
      middle: middleDigits.padStart(3, '0'),
      decimal: decimalPart
    }
  }
  
  const currentParts = formatPrice(price)
  const previousParts = formatPrice(previousPrice)
  
  return (
    <motion.div 
      className="flex items-center gap-2"
      layout
    >
      <PriceBlock 
        value={currentParts.first}
        previousValue={previousParts.first}
      />
      <PriceBlock 
        value={currentParts.middle}
        previousValue={previousParts.middle}
      />
      <PriceBlock 
        value={currentParts.decimal}
        previousValue={previousParts.decimal}
      />
    </motion.div>
  )
}