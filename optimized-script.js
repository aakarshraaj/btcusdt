/**
 * Optimized JavaScript for Bitcoin Price Tracker
 * Production-ready with performance optimizations
 */

// Critical performance optimizations
(function() {
  'use strict';
  
  // Performance monitoring and Web Vitals
  class PerformanceMonitor {
    constructor() {
      this.metrics = new Map();
      this.observers = new Map();
      this.setupVitalsTracking();
    }
    
    setupVitalsTracking() {
      // Core Web Vitals tracking
      if ('PerformanceObserver' in window) {
        // Largest Contentful Paint (LCP)
        this.observeMetric('largest-contentful-paint', (entries) => {
          const lastEntry = entries[entries.length - 1];
          this.reportMetric('LCP', lastEntry.startTime);
        });
        
        // First Input Delay (FID)
        this.observeMetric('first-input', (entries) => {
          const firstEntry = entries[0];
          const fid = firstEntry.processingStart - firstEntry.startTime;
          this.reportMetric('FID', fid);
        });
        
        // Cumulative Layout Shift (CLS)
        this.observeMetric('layout-shift', (entries) => {
          let cls = 0;
          entries.forEach(entry => {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          });
          this.reportMetric('CLS', cls);
        });
        
        // Long tasks monitoring
        this.observeMetric('longtask', (entries) => {
          entries.forEach(entry => {
            if (entry.duration > 50) {
              console.warn('Long task detected:', {
                duration: entry.duration,
                startTime: entry.startTime
              });
              this.reportMetric('Long Task', entry.duration);
            }
          });
        });
      }
    }
    
    observeMetric(type, callback) {
      try {
        const observer = new PerformanceObserver((list) => {
          callback(list.getEntries());
        });
        observer.observe({ entryTypes: [type] });
        this.observers.set(type, observer);
      } catch (e) {
        console.warn(`Could not observe ${type}:`, e);
      }
    }
    
    reportMetric(name, value) {
      this.metrics.set(name, value);
      
      // Report to analytics if available
      if (window.gtag) {
        window.gtag('event', 'web_vitals', {
          metric_name: name,
          metric_value: Math.round(value),
          metric_delta: Math.round(value)
        });
      }
      
      console.log(`${name}: ${Math.round(value)}ms`);
    }
    
    getMetrics() {
      return Object.fromEntries(this.metrics);
    }
    
    disconnect() {
      this.observers.forEach(observer => observer.disconnect());
      this.observers.clear();
    }
  }
  
  // Initialize performance monitoring
  const performanceMonitor = new PerformanceMonitor();
  
  // Optimized image loading with modern format support
  class ImageOptimizer {
    constructor() {
      this.supportsWebP = this.checkWebPSupport();
      this.supportsAVIF = this.checkAVIFSupport();
      this.setupLazyLoading();
    }
    
    checkWebPSupport() {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    
    checkAVIFSupport() {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    }
    
    getOptimalFormat(originalSrc) {
      if (this.supportsAVIF && originalSrc.includes('.jpg') || originalSrc.includes('.png')) {
        return originalSrc.replace(/\.(jpg|jpeg|png)$/, '.avif');
      }
      if (this.supportsWebP && originalSrc.includes('.jpg') || originalSrc.includes('.png')) {
        return originalSrc.replace(/\.(jpg|jpeg|png)$/, '.webp');
      }
      return originalSrc;
    }
    
    setupLazyLoading() {
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              this.loadOptimizedImage(img);
              observer.unobserve(img);
            }
          });
        }, {
          rootMargin: '50px 0px',
          threshold: 0.01
        });
        
        // Observe all images with data-src attribute
        document.querySelectorAll('img[data-src]').forEach(img => {
          imageObserver.observe(img);
        });
        
        // Set up mutation observer for dynamically added images
        const mutationObserver = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) {
                const images = node.querySelectorAll ? node.querySelectorAll('img[data-src]') : [];
                images.forEach(img => imageObserver.observe(img));
              }
            });
          });
        });
        
        mutationObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    }
    
    loadOptimizedImage(img) {
      const src = img.dataset.src;
      if (!src) return;
      
      const optimizedSrc = this.getOptimalFormat(src);
      
      // Create a new image to test loading
      const testImg = new Image();
      testImg.onload = () => {
        img.src = optimizedSrc;
        img.classList.add('loaded');
      };
      testImg.onerror = () => {
        // Fallback to original format
        img.src = src;
        img.classList.add('loaded');
      };
      testImg.src = optimizedSrc;
    }
  }
  
  // Critical resource preloader
  class ResourcePreloader {
    constructor() {
      this.preloadedResources = new Set();
      this.setupHoverPrefetch();
    }
    
    preloadResource(href, as = 'fetch', crossorigin = false) {
      if (this.preloadedResources.has(href)) return;
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      if (crossorigin) link.crossOrigin = 'anonymous';
      
      document.head.appendChild(link);
      this.preloadedResources.add(href);
    }
    
    prefetchResource(href) {
      if (this.preloadedResources.has(href)) return;
      
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      
      document.head.appendChild(link);
      this.preloadedResources.add(href);
    }
    
    setupHoverPrefetch() {
      let hoverTimer;
      
      document.addEventListener('mouseover', (e) => {
        const link = e.target.closest('a[href]');
        if (!link || !link.href.startsWith(window.location.origin)) return;
        
        hoverTimer = setTimeout(() => {
          this.prefetchResource(link.href);
        }, 100);
      }, { passive: true });
      
      document.addEventListener('mouseout', () => {
        if (hoverTimer) {
          clearTimeout(hoverTimer);
          hoverTimer = null;
        }
      }, { passive: true });
    }
  }
  
  // Optimized API client with caching and error handling
  class APIClient {
    constructor() {
      this.cache = new Map();
      this.pendingRequests = new Map();
      this.retryAttempts = new Map();
      this.maxRetries = 3;
      this.cacheExpiry = 30000; // 30 seconds
    }
    
    async fetch(url, options = {}) {
      const cacheKey = this.getCacheKey(url, options);
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
        this.cache.delete(cacheKey);
      }
      
      // Prevent duplicate requests
      if (this.pendingRequests.has(cacheKey)) {
        return this.pendingRequests.get(cacheKey);
      }
      
      const request = this.makeRequest(url, options, cacheKey);
      this.pendingRequests.set(cacheKey, request);
      
      try {
        const result = await request;
        this.pendingRequests.delete(cacheKey);
        this.retryAttempts.delete(cacheKey);
        return result;
      } catch (error) {
        this.pendingRequests.delete(cacheKey);
        throw error;
      }
    }
    
    async makeRequest(url, options, cacheKey) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Cache successful responses
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        
        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Implement retry logic for network errors
        const retries = this.retryAttempts.get(cacheKey) || 0;
        if (retries < this.maxRetries && this.shouldRetry(error)) {
          this.retryAttempts.set(cacheKey, retries + 1);
          await this.delay(Math.pow(2, retries) * 1000); // Exponential backoff
          return this.makeRequest(url, options, cacheKey);
        }
        
        throw error;
      }
    }
    
    shouldRetry(error) {
      return error.name === 'TypeError' || // Network error
             error.name === 'AbortError' || // Timeout
             (error.message && error.message.includes('HTTP 5')); // Server error
    }
    
    getCacheKey(url, options) {
      return `${url}_${JSON.stringify(options)}`;
    }
    
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    clearCache() {
      this.cache.clear();
    }
  }
  
  // Bitcoin price tracker with WebSocket optimization
  class BitcoinTracker {
    constructor() {
      this.apiClient = new APIClient();
      this.websocket = null;
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 5;
      this.price = 0;
      this.priceHistory = [];
      this.subscribers = new Set();
      this.setupWebSocket();
    }
    
    setupWebSocket() {
      try {
        this.websocket = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');
        
        this.websocket.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
        };
        
        this.websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.c) {
              this.updatePrice(parseFloat(data.c));
            }
          } catch (error) {
            console.error('Error parsing WebSocket data:', error);
          }
        };
        
        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        this.websocket.onclose = () => {
          console.log('WebSocket closed');
          this.handleReconnect();
        };
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
        this.fallbackToPolling();
      }
    }
    
    handleReconnect() {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.pow(2, this.reconnectAttempts) * 1000;
        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        setTimeout(() => this.setupWebSocket(), delay);
      } else {
        console.log('Max reconnection attempts reached, falling back to polling');
        this.fallbackToPolling();
      }
    }
    
    async fallbackToPolling() {
      try {
        const data = await this.apiClient.fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        this.updatePrice(parseFloat(data.price));
      } catch (error) {
        console.error('Error fetching price:', error);
      }
      
      // Poll every 5 seconds as fallback
      setTimeout(() => this.fallbackToPolling(), 5000);
    }
    
    updatePrice(newPrice) {
      const oldPrice = this.price;
      this.price = newPrice;
      
      // Store price history (last 100 points)
      this.priceHistory.push({
        price: newPrice,
        timestamp: Date.now()
      });
      
      if (this.priceHistory.length > 100) {
        this.priceHistory.shift();
      }
      
      // Notify subscribers
      this.subscribers.forEach(callback => {
        try {
          callback(newPrice, oldPrice);
        } catch (error) {
          console.error('Error in price subscriber:', error);
        }
      });
    }
    
    subscribe(callback) {
      this.subscribers.add(callback);
      // Immediately call with current price
      if (this.price > 0) {
        callback(this.price, 0);
      }
      
      return () => this.subscribers.delete(callback);
    }
    
    getCurrentPrice() {
      return this.price;
    }
    
    getPriceHistory() {
      return [...this.priceHistory];
    }
    
    disconnect() {
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }
      this.subscribers.clear();
    }
  }
  
  // DOM utilities with performance optimizations
  class DOMUtils {
    static createElement(tag, attributes = {}, children = []) {
      const element = document.createElement(tag);
      
      Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
          element.className = value;
        } else if (key === 'dataset') {
          Object.entries(value).forEach(([dataKey, dataValue]) => {
            element.dataset[dataKey] = dataValue;
          });
        } else {
          element.setAttribute(key, value);
        }
      });
      
      children.forEach(child => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else {
          element.appendChild(child);
        }
      });
      
      return element;
    }
    
    static formatPrice(price) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price);
    }
    
    static formatChange(change) {
      const sign = change >= 0 ? '+' : '';
      return `${sign}${change.toFixed(2)}%`;
    }
    
    static debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
    
    static throttle(func, limit) {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    }
  }
  
  // App initialization with performance optimizations
  class App {
    constructor() {
      this.tracker = null;
      this.imageOptimizer = null;
      this.resourcePreloader = null;
      this.performanceMonitor = performanceMonitor;
      this.unsubscribers = [];
      
      this.init();
    }
    
    async init() {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
      }
      
      // Initialize components
      this.setupComponents();
      this.setupEventListeners();
      this.preloadCriticalResources();
      
      // Track app initialization time
      this.performanceMonitor.reportMetric('App Init', performance.now());
    }
    
    setupComponents() {
      this.tracker = new BitcoinTracker();
      this.imageOptimizer = new ImageOptimizer();
      this.resourcePreloader = new ResourcePreloader();
      
      // Subscribe to price updates
      const unsubscribe = this.tracker.subscribe((newPrice, oldPrice) => {
        this.updatePriceDisplay(newPrice, oldPrice);
      });
      this.unsubscribers.push(unsubscribe);
    }
    
    setupEventListeners() {
      // Optimized scroll handler
      const scrollHandler = DOMUtils.throttle(() => {
        this.handleScroll();
      }, 100);
      
      window.addEventListener('scroll', scrollHandler, { passive: true });
      
      // Visibility change handler for performance optimization
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.handleVisibilityHidden();
        } else {
          this.handleVisibilityVisible();
        }
      });
      
      // Network status handlers
      window.addEventListener('online', () => {
        console.log('Network connection restored');
        if (!this.tracker.websocket || this.tracker.websocket.readyState !== WebSocket.OPEN) {
          this.tracker.setupWebSocket();
        }
      });
      
      window.addEventListener('offline', () => {
        console.log('Network connection lost');
      });
    }
    
    preloadCriticalResources() {
      // Preload critical API endpoints
      this.resourcePreloader.preloadResource('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
      
      // Preload calculator routes
      setTimeout(() => {
        [
          '/calculators/profit',
          '/calculators/dca',
          '/calculators/mining',
          '/calculators/staking'
        ].forEach(route => {
          this.resourcePreloader.prefetchResource(route);
        });
      }, 2000);
    }
    
    updatePriceDisplay(newPrice, oldPrice) {
      const priceElement = document.querySelector('[data-price-display]');
      if (!priceElement) return;
      
      const formattedPrice = DOMUtils.formatPrice(newPrice);
      priceElement.textContent = formattedPrice;
      
      // Add visual feedback for price changes
      if (oldPrice > 0) {
        const changeClass = newPrice > oldPrice ? 'price-up' : 'price-down';
        priceElement.classList.add(changeClass);
        setTimeout(() => {
          priceElement.classList.remove(changeClass);
        }, 1000);
      }
    }
    
    handleScroll() {
      // Implement scroll-based optimizations
      const scrollY = window.scrollY;
      
      // Hide/show header based on scroll direction
      const header = document.querySelector('header');
      if (header) {
        if (scrollY > 100) {
          header.classList.add('header-hidden');
        } else {
          header.classList.remove('header-hidden');
        }
      }
    }
    
    handleVisibilityHidden() {
      // Pause non-critical operations when tab is hidden
      if (this.tracker && this.tracker.websocket) {
        // Don't close WebSocket, but reduce update frequency
        console.log('Tab hidden, reducing update frequency');
      }
    }
    
    handleVisibilityVisible() {
      // Resume normal operations when tab becomes visible
      if (this.tracker) {
        console.log('Tab visible, resuming normal operations');
      }
    }
    
    destroy() {
      // Cleanup
      this.unsubscribers.forEach(unsubscribe => unsubscribe());
      this.unsubscribers = [];
      
      if (this.tracker) {
        this.tracker.disconnect();
      }
      
      if (this.performanceMonitor) {
        this.performanceMonitor.disconnect();
      }
    }
  }
  
  // Global utilities
  window.BitcoinTracker = {
    App,
    DOMUtils,
    APIClient,
    ImageOptimizer,
    ResourcePreloader,
    PerformanceMonitor
  };
  
  // Auto-initialize app
  const app = new App();
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    app.destroy();
  });
  
  // Export for module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App, DOMUtils, APIClient, ImageOptimizer, ResourcePreloader, PerformanceMonitor };
  }
  
})();