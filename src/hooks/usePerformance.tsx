import { useEffect } from 'react';

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// Web Vitals monitoring
export function useWebVitals() {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;

    // Dynamic import to avoid loading in development
    import('web-vitals').then((webVitals) => {
      function sendToAnalytics(metric: any) {
        // Send to Google Analytics 4
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', metric.name, {
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            event_category: 'Web Vitals',
            event_label: metric.id,
            non_interaction: true,
          });
        }
        
        // Log for debugging
        console.log('Web Vital:', metric);
      }

      // Check if the functions exist before calling them
      if (webVitals.onCLS) webVitals.onCLS(sendToAnalytics);
      if (webVitals.onINP) webVitals.onINP(sendToAnalytics); // Updated from getFID
      if (webVitals.onFCP) webVitals.onFCP(sendToAnalytics);
      if (webVitals.onLCP) webVitals.onLCP(sendToAnalytics);
      if (webVitals.onTTFB) webVitals.onTTFB(sendToAnalytics);
    }).catch(() => {
      // Graceful fallback if web-vitals fails to load
      console.log('Web Vitals monitoring not available');
    });
  }, []);
}

// Intersection Observer hook for lazy loading
export function useLazyLoad(ref: React.RefObject<Element>, callback: () => void) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
            observer.unobserve(element);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, callback]);
}

// Prefetch link on hover
export function usePrefetchOnHover(href: string) {
  useEffect(() => {
    const prefetchLink = () => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    };

    const element = document.querySelector(`a[href="${href}"]`);
    if (element) {
      element.addEventListener('mouseenter', prefetchLink, { once: true });
      
      return () => {
        element.removeEventListener('mouseenter', prefetchLink);
      };
    }
  }, [href]);
}

// Preload critical resources
export function preloadCriticalResources() {
  useEffect(() => {
    // Preload critical fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap';
    fontLink.as = 'style';
    fontLink.onload = () => {
      fontLink.rel = 'stylesheet';
    };
    document.head.appendChild(fontLink);

    // Preconnect to external domains
    const preconnectDomains = [
      'https://stream.binance.com',
      'https://api.binance.com',
      'https://fonts.gstatic.com'
    ];

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }, []);
}

// Image optimization component
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  loading = 'lazy' 
}: OptimizedImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={loading}
      decoding="async"
      style={{ 
        aspectRatio: width && height ? `${width}/${height}` : undefined,
        maxWidth: '100%',
        height: 'auto'
      }}
    />
  );
}

// Performance monitoring hook
export function usePerformanceMonitoring() {
  useWebVitals();
  preloadCriticalResources();
  
  useEffect(() => {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn('Long task detected:', entry);
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      
      return () => observer.disconnect();
    }
  }, []);
}