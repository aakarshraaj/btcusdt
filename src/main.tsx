import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRouter from './AppRouter'
import '../styles/globals.css'
import { usePerformanceMonitoring } from './hooks/usePerformance'

// Performance monitoring wrapper
function App() {
  usePerformanceMonitoring();
  return <AppRouter />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)


