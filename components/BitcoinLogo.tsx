import { motion } from 'motion/react'

export default function BitcoinLogo() {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
        <svg 
          width="48" 
          height="48" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          <path 
            d="M17.88 7.47c.07-.96-.63-1.48-1.71-1.82L16.67 3l-1.33-.34-.49 1.95c-.35-.09-.71-.17-1.07-.25L14.27 2.4 12.94 2.06l-.5 1.95c-.29-.07-.57-.13-.84-.19v-.01L9.34 3.4l-.18.71s.98.23.96.24c.54.14.64.5.62.79L9.56 8.36c.04.01.09.02.15.04-.05-.01-.1-.02-.15-.04L8.5 12.4c-.07.17-.24.42-.63.32.01.02-.96-.24-.96-.24L6.27 13.4l2.06.52c.38.1.76.2 1.13.29l-.51 2.03 1.33.33.5-2.01c.37.1.72.19 1.07.27l-.5 1.99 1.33.33.51-2.03c2.1.4 3.68.24 4.35-1.65.54-1.52-.03-2.4-.4-2.66.96-.22 1.68-.85 1.87-2.14l-.01-.01zm-3.35 4.69c-.38 1.52-2.96.7-3.8.49l.68-2.7c.84.21 3.53.63 3.12 2.21zm.38-4.71c-.35 1.38-2.5.68-3.19.51l.61-2.46c.69.17 2.94.49 2.58 1.95z" 
            fill="currentColor"
          />
        </svg>
      </div>
      <div className="mt-2 text-sm text-gray-600 font-medium">BTC/USDT</div>
      <div className="text-xs text-gray-400">Binance</div>
    </motion.div>
  )
}