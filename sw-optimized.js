/**
 * Optimized Service Worker for Bitcoin Price Tracker
 * Enhanced caching, performance optimizations, and offline support
 */

const CACHE_NAME = 'btc-tracker-v2-optimized';
const STATIC_CACHE_NAME = 'btc-static-v2';
const DYNAMIC_CACHE_NAME = 'btc-dynamic-v2';
const API_CACHE_NAME = 'btc-api-v2';

// Cache configuration
const CACHE_CONFIG = {
  staticCacheTTL: 24 * 60 * 60 * 1000, // 24 hours
  apiCacheTTL: 5 * 60 * 1000, // 5 minutes
  imageCacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxCacheSize: 50, // Maximum number of items in dynamic cache
  maxApiCacheSize: 20 // Maximum number of API responses
};

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/optimized-index.html',
  '/optimized-styles.css',
  '/optimized-script.js',
  '/favicon-light.svg',
  '/favicon-dark.svg',
  '/site.webmanifest',
  '/apple-touch-icon.png'
];

// API endpoints to cache
const API_PATTERNS = [
  /^https:\/\/api\.binance\.com\/api\/v3\//,
  /^https:\/\/stream\.binance\.com/
];

// Image patterns for optimization
const IMAGE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i
];

// Network-first patterns (real-time data)
const NETWORK_FIRST_PATTERNS = [
  /^https:\/\/stream\.binance\.com/,
  /ticker/i,
  /price/i
];

// Performance monitoring
class ServiceWorkerPerformance {
  constructor() {
    this.metrics = new Map();
    this.startTime = Date.now();
  }
  
  recordMetric(name, duration) {
    this.metrics.set(name, {
      duration,
      timestamp: Date.now()
    });
  }
  
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }
}

const swPerformance = new ServiceWorkerPerformance();

// Cache management utilities
class CacheManager {
  static async cleanupCache(cacheName, maxSize, maxAge) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length <= maxSize) return;
    
    // Get response headers to check timestamps
    const responses = await Promise.all(
      keys.map(async key => {
        const response = await cache.match(key);
        return {
          key,
          response,
          timestamp: this.getTimestampFromHeaders(response)
        };
      })
    );
    
    // Sort by timestamp (oldest first)
    responses.sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove oldest entries
    const toDelete = responses.slice(0, keys.length - maxSize);
    await Promise.all(
      toDelete.map(({ key }) => cache.delete(key))
    );
  }
  
  static getTimestampFromHeaders(response) {
    const cacheTime = response.headers.get('sw-cache-timestamp');
    return cacheTime ? parseInt(cacheTime) : 0;
  }
  
  static addTimestampToResponse(response) {
    const headers = new Headers(response.headers);
    headers.set('sw-cache-timestamp', Date.now().toString());
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
  
  static isResponseFresh(response, maxAge) {
    const timestamp = this.getTimestampFromHeaders(response);
    return timestamp && (Date.now() - timestamp) < maxAge;
  }
}

// Network utilities with retry logic
class NetworkManager {
  static async fetchWithRetry(request, retries = 3) {
    let lastError;
    
    for (let i = 0; i <= retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch(request.clone(), {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return response;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error;
        
        if (i < retries) {
          // Exponential backoff
          await this.delay(Math.pow(2, i) * 1000);
        }
      }
    }
    
    throw lastError;
  }
  
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static isOnline() {
    return navigator.onLine !== false;
  }
}

// Caching strategies
class CachingStrategies {
  // Cache first, then network
  static async cacheFirst(request, cacheName, maxAge) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && CacheManager.isResponseFresh(cachedResponse, maxAge)) {
      swPerformance.recordMetric('cache-hit', 0);
      return cachedResponse;
    }
    
    try {
      const startTime = performance.now();
      const networkResponse = await NetworkManager.fetchWithRetry(request);
      const duration = performance.now() - startTime;
      
      swPerformance.recordMetric('network-fetch', duration);
      
      // Cache the response
      const responseToCache = CacheManager.addTimestampToResponse(networkResponse.clone());
      await cache.put(request, responseToCache);
      
      // Cleanup old entries
      await CacheManager.cleanupCache(cacheName, CACHE_CONFIG.maxCacheSize, maxAge);
      
      return networkResponse;
    } catch (error) {
      // Return stale cache if network fails
      if (cachedResponse) {
        swPerformance.recordMetric('stale-cache-hit', 0);
        return cachedResponse;
      }
      throw error;
    }
  }
  
  // Network first, then cache
  static async networkFirst(request, cacheName, maxAge) {
    try {
      const startTime = performance.now();
      const networkResponse = await NetworkManager.fetchWithRetry(request);
      const duration = performance.now() - startTime;
      
      swPerformance.recordMetric('network-first-success', duration);
      
      // Cache the response for future fallback
      const cache = await caches.open(cacheName);
      const responseToCache = CacheManager.addTimestampToResponse(networkResponse.clone());
      await cache.put(request, responseToCache);
      
      return networkResponse;
    } catch (error) {
      // Fallback to cache
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        swPerformance.recordMetric('network-first-fallback', 0);
        return cachedResponse;
      }
      
      throw error;
    }
  }
  
  // Stale while revalidate
  static async staleWhileRevalidate(request, cacheName, maxAge) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Always try to fetch fresh data in background
    const fetchPromise = NetworkManager.fetchWithRetry(request)
      .then(response => {
        const responseToCache = CacheManager.addTimestampToResponse(response.clone());
        cache.put(request, responseToCache);
        return response;
      })
      .catch(() => {
        // Ignore network errors for background updates
      });
    
    // Return cached response immediately if available
    if (cachedResponse) {
      swPerformance.recordMetric('swr-cache-hit', 0);
      return cachedResponse;
    }
    
    // Wait for network if no cache
    return fetchPromise;
  }
}

// Route handlers
function getRequestHandler(request) {
  const url = new URL(request.url);
  
  // API requests - network first for real-time data
  if (API_PATTERNS.some(pattern => pattern.test(url.href))) {
    if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.href))) {
      return (req) => CachingStrategies.networkFirst(req, API_CACHE_NAME, CACHE_CONFIG.apiCacheTTL);
    }
    return (req) => CachingStrategies.staleWhileRevalidate(req, API_CACHE_NAME, CACHE_CONFIG.apiCacheTTL);
  }
  
  // Images - cache first with long TTL
  if (IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return (req) => CachingStrategies.cacheFirst(req, DYNAMIC_CACHE_NAME, CACHE_CONFIG.imageCacheTTL);
  }
  
  // Static assets - cache first
  if (STATIC_ASSETS.includes(url.pathname) || url.pathname.startsWith('/assets/')) {
    return (req) => CachingStrategies.cacheFirst(req, STATIC_CACHE_NAME, CACHE_CONFIG.staticCacheTTL);
  }
  
  // Default: stale while revalidate
  return (req) => CachingStrategies.staleWhileRevalidate(req, DYNAMIC_CACHE_NAME, CACHE_CONFIG.staticCacheTTL);
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE_NAME);
      
      // Cache static assets with error handling
      const cachePromises = STATIC_ASSETS.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
          }
        } catch (error) {
          console.warn(`Failed to cache ${url}:`, error);
        }
      });
      
      await Promise.allSettled(cachePromises);
      
      // Skip waiting to activate immediately
      await self.skipWaiting();
    })()
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    (async () => {
      // Claim all clients immediately
      await self.clients.claim();
      
      // Cleanup old caches
      const cacheNames = await caches.keys();
      const validCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, API_CACHE_NAME];
      
      const deletionPromises = cacheNames
        .filter(cacheName => !validCaches.includes(cacheName))
        .map(cacheName => {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        });
      
      await Promise.all(deletionPromises);
      
      // Perform cache cleanup
      await Promise.all([
        CacheManager.cleanupCache(DYNAMIC_CACHE_NAME, CACHE_CONFIG.maxCacheSize, CACHE_CONFIG.staticCacheTTL),
        CacheManager.cleanupCache(API_CACHE_NAME, CACHE_CONFIG.maxApiCacheSize, CACHE_CONFIG.apiCacheTTL)
      ]);
    })()
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests that we can't cache
  if (!event.request.url.startsWith(self.location.origin) && !API_PATTERNS.some(pattern => pattern.test(event.request.url))) {
    return;
  }
  
  const handler = getRequestHandler(event.request);
  
  event.respondWith(
    (async () => {
      try {
        return await handler(event.request);
      } catch (error) {
        console.error('Fetch handler error:', error);
        
        // Fallback responses
        if (event.request.destination === 'document') {
          // Return cached index.html for navigation requests
          const cache = await caches.open(STATIC_CACHE_NAME);
          return await cache.match('/') || await cache.match('/optimized-index.html');
        }
        
        // For other requests, let the browser handle it
        throw error;
      }
    })()
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      (async () => {
        try {
          // Perform background sync tasks
          console.log('Performing background sync...');
          
          // Update critical data when online
          if (NetworkManager.isOnline()) {
            const cache = await caches.open(API_CACHE_NAME);
            const request = new Request('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
            
            try {
              const response = await fetch(request);
              if (response.ok) {
                await cache.put(request, response.clone());
                
                // Notify clients of updated data
                const clients = await self.clients.matchAll();
                clients.forEach(client => {
                  client.postMessage({
                    type: 'DATA_UPDATED',
                    data: 'Price data updated'
                  });
                });
              }
            } catch (error) {
              console.warn('Background sync failed:', error);
            }
          }
        } catch (error) {
          console.error('Background sync error:', error);
        }
      })()
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_PERFORMANCE_METRICS':
      event.ports[0]?.postMessage({
        type: 'PERFORMANCE_METRICS',
        data: swPerformance.getMetrics()
      });
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        (async () => {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
          event.ports[0]?.postMessage({ type: 'CACHE_CLEARED' });
        })()
      );
      break;
      
    case 'PREFETCH_RESOURCES':
      if (data && Array.isArray(data.urls)) {
        event.waitUntil(
          (async () => {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            const prefetchPromises = data.urls.map(async (url) => {
              try {
                const response = await fetch(url);
                if (response.ok) {
                  await cache.put(url, response);
                }
              } catch (error) {
                console.warn(`Failed to prefetch ${url}:`, error);
              }
            });
            
            await Promise.allSettled(prefetchPromises);
            event.ports[0]?.postMessage({ type: 'PREFETCH_COMPLETE' });
          })()
        );
      }
      break;
  }
});

// Notification handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Open the app when notification is clicked
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      // Focus existing window if available
      const existingClient = clients.find(client => client.url.includes(self.location.origin));
      if (existingClient) {
        return existingClient.focus();
      }
      
      // Open new window
      return self.clients.openWindow('/');
    })
  );
});

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: 'Bitcoin price update available',
    icon: '/favicon-light.svg',
    badge: '/favicon-light.svg',
    tag: 'price-update',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View Price'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      options.body = data.message || options.body;
      options.title = data.title || 'Bitcoin Tracker';
    } catch (error) {
      console.warn('Failed to parse push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Bitcoin Tracker', options)
  );
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'price-update') {
    event.waitUntil(
      (async () => {
        try {
          // Update price data in background
          const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
          if (response.ok) {
            const data = await response.json();
            
            // Store in cache
            const cache = await caches.open(API_CACHE_NAME);
            await cache.put(event.tag, new Response(JSON.stringify(data)));
            
            // Optionally show notification for significant price changes
            // Implementation would depend on previous price comparison
          }
        } catch (error) {
          console.warn('Periodic sync failed:', error);
        }
      })()
    );
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Optimized Service Worker loaded successfully');