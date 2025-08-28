import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Optimize React refresh
      fastRefresh: true
    })
  ],
  build: {
    // Explicitly set output directory for Vercel deployment
    outDir: 'dist',
    // Enable code splitting with enhanced configuration
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', '@radix-ui/react-select'],
          charts: ['recharts'],
          motion: ['motion'],
          utils: ['clsx', 'tailwind-merge'],
          performance: ['web-vitals']
        },
        // Optimize chunk file names for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `assets/[name]-[hash][extname]`;
          }
          if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Disable source maps for production (better performance)
    sourcemap: false,
    // Enhanced CSS minification
    cssMinify: true,
    // Advanced minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Report compressed size
    reportCompressedSize: true
  },
  // Enhanced development optimizations
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      'lucide-react',
      'recharts',
      'motion',
      'web-vitals'
    ],
    // Exclude heavy dependencies from pre-bundling
    exclude: ['@radix-ui/react-select']
  },
  // Enhanced CSS preprocessing
  css: {
    // Enable CSS modules
    modules: {
      localsConvention: 'camelCase'
    }
  },
  // Performance and caching for development
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000'
    },
    // Enable HTTP/2 server push hints
    cors: true,
    // Optimize HMR
    hmr: {
      overlay: false
    }
  },
  // Enhanced preview configuration
  preview: {
    headers: {
      'Cache-Control': 'public, max-age=31536000',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.binance.com https://stream.binance.com wss://stream.binance.com; img-src 'self' data: https:; manifest-src 'self'"
    },
    port: 4173,
    strictPort: true
  },
  // Define global constants for performance optimization
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production'),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  },
  // Enhanced resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@utils': '/src/utils',
      '@hooks': '/src/hooks',
      '@styles': '/src/styles'
    }
  }
})


