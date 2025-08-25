import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRouter from './AppRouter'
import '../styles/globals.css'
import { usePerformanceMonitoring } from './hooks/usePerformance'
import { useAccessibility } from './hooks/useAccessibility'

// Performance monitoring and accessibility wrapper
function App() {
  usePerformanceMonitoring();
  useAccessibility();
  return <AppRouter />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)


