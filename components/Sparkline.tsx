import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { motion } from 'motion/react'

interface SparklineProps {
  data: { timestamp: number; price: number }[]
  currentPrice: number
  previousPrice: number
}

export default function Sparkline({ data, currentPrice, previousPrice }: SparklineProps) {
  const isUp = currentPrice > previousPrice
  const lineColor = isUp ? '#10b981' : '#ef4444'
  
  return (
    <motion.div 
      className="w-full h-16 mt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-xs text-gray-500 mb-2 flex items-center justify-between">
        <span>60s Trend</span>
        <span className={`${isUp ? 'text-green-600' : 'text-red-600'}`}>
          {isUp ? '↗' : '↘'} ${Math.abs(currentPrice - previousPrice).toFixed(2)}
        </span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            strokeDasharray={data.length < 5 ? "2 2" : "0"}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  )
}