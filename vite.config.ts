import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
    })
  ],
  build: {
    // Enable code splitting and optimize chunks
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', '@radix-ui/react-select'],
          charts: ['recharts'],
          motion: ['motion'],
          utils: ['clsx', 'tailwind-merge']
        },
        // Optimize asset names for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging (disabled for performance)
    sourcemap: false,
    // Minimize CSS
    cssMinify: true,
    // Enable compression with optimized settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    // Target modern browsers for better optimization
    target: 'es2020',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize asset size threshold
    assetsInlineLimit: 4096
  },
  // Enable development optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'recharts'],
    exclude: ['@vite/client', '@vite/env']
  },
  // Performance and caching for development
  server: {
    headers: {
      'Cache-Control': 'no-cache'
    },
    // Enable HTTP/2 push for development
    force: true
  },
  preview: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  },
  // Define global constants for tree-shaking
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production')
  }
})


