import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  noindex?: boolean;
  structuredData?: any;
}

const defaultSEO = {
  title: 'Live Bitcoin Price (BTC/USDT) | Real-Time Crypto Tracker for BTC, ETH, SOL',
  description: 'Track Bitcoin (BTC), Ethereum (ETH), and Solana (SOL) prices in real-time with our professional crypto price tracker. Live updates, price breakdowns, and crypto analysis tools.',
  keywords: 'bitcoin price, crypto tracker, BTC USDT, ethereum price, solana price, live crypto prices, cryptocurrency tracker, binance api, real time crypto, bitcoin price today, bitcoin price live, btc price prediction, crypto market cap, digital currency prices',
  image: 'https://btc-testground.vercel.app/og-image.png',
  url: 'https://btc-testground.vercel.app/',
  type: 'website'
};

export function SEO({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  noindex = false,
  structuredData
}: SEOProps) {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Update meta tags
    const updateMetaTag = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.querySelector(`meta[name="${property}"]`) as HTMLMetaElement;
      }
      if (element) {
        element.content = content;
      }
    };

    if (description) {
      updateMetaTag('description', description);
      updateMetaTag('og:description', description);
      updateMetaTag('twitter:description', description);
    }

    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    if (image) {
      updateMetaTag('og:image', image);
      updateMetaTag('twitter:image', image);
    }

    if (url) {
      updateMetaTag('og:url', url);
      
      // Update canonical link
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (canonical) {
        canonical.href = url;
      }
    }

    updateMetaTag('og:type', type);

    // Handle noindex
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (robotsMeta && noindex) {
      robotsMeta.content = 'noindex, nofollow';
    } else if (robotsMeta) {
      robotsMeta.content = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
    }

    // Add or update structured data
    if (structuredData) {
      // Remove existing page-specific structured data
      const existingStructuredData = document.querySelector('#page-structured-data');
      if (existingStructuredData) {
        existingStructuredData.remove();
      }

      // Add new structured data
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'page-structured-data';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

  }, [title, description, keywords, image, url, type, noindex, structuredData]);

  return null;
}

// Pre-defined SEO configurations for different pages
export const seoConfigs = {
  home: {
    title: 'Live Bitcoin Price (BTC/USDT) | Real-Time Crypto Tracker for BTC, ETH, SOL',
    description: 'Track Bitcoin (BTC), Ethereum (ETH), and Solana (SOL) prices in real-time with our professional crypto price tracker. Live updates, price breakdowns, and crypto analysis tools powered by Binance WebSocket.',
    keywords: 'bitcoin price, crypto tracker, BTC USDT, ethereum price, solana price, live crypto prices, cryptocurrency tracker, binance api, real time crypto, bitcoin price today, bitcoin price live, btc price prediction, crypto market cap, digital currency prices, crypto portfolio tracker, bitcoin investment tracker, crypto price alerts, btc to usd converter',
    url: 'https://btc-testground.vercel.app/'
  },
  calculators: {
    title: 'Free Crypto Calculators | Bitcoin Profit, DCA, Mining & Staking Calculator Tools',
    description: 'Professional cryptocurrency calculators for Bitcoin and crypto profits, dollar cost averaging (DCA), mining profitability, and staking rewards. Free crypto tools with live market data.',
    keywords: 'crypto calculator, bitcoin profit calculator, DCA calculator, mining calculator, staking calculator, cryptocurrency profit, btc profit calculator, crypto roi calculator, bitcoin investment calculator, crypto tools, cryptocurrency calculator suite, bitcoin trading calculator',
    url: 'https://btc-testground.vercel.app/calculators',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Cryptocurrency Calculators",
      "description": "Professional cryptocurrency calculators suite including profit, DCA, mining, and staking calculators",
      "url": "https://btc-testground.vercel.app/calculators",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://btc-testground.vercel.app/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Calculators",
            "item": "https://btc-testground.vercel.app/calculators"
          }
        ]
      },
      "mainEntity": {
        "@type": "SoftwareApplication",
        "name": "Crypto Calculator Suite",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      }
    }
  },
  profit: {
    title: 'Bitcoin Profit Calculator | Crypto Investment ROI Calculator with Live Prices',
    description: 'Calculate your Bitcoin and cryptocurrency investment profits with our advanced profit calculator. Track ROI, fees, and net gains for BTC, ETH, SOL with real-time market data.',
    keywords: 'bitcoin profit calculator, crypto profit calculator, investment ROI calculator, bitcoin ROI, cryptocurrency profit, crypto gains calculator, btc investment calculator, trading profit calculator, crypto return calculator, bitcoin investment tracker',
    url: 'https://btc-testground.vercel.app/calculators/profit',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Bitcoin Profit Calculator",
      "description": "Calculate cryptocurrency investment profits and ROI with real-time market data",
      "url": "https://btc-testground.vercel.app/calculators/profit",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web Browser",
      "featureList": [
        "Real-time profit calculation",
        "Multiple cryptocurrency support",
        "Fee calculation included",
        "ROI percentage display",
        "Live market price integration"
      ],
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
  },
  dca: {
    title: 'Dollar Cost Averaging Calculator | Bitcoin DCA Strategy Calculator & Planner',
    description: 'Plan your Bitcoin DCA strategy with our dollar cost averaging calculator. Calculate optimal investment schedules, average costs, and long-term portfolio growth with historical data.',
    keywords: 'DCA calculator, dollar cost averaging, bitcoin DCA, crypto DCA strategy, average cost calculator, investment strategy calculator, bitcoin averaging, crypto investment plan, DCA strategy bitcoin, systematic investment calculator',
    url: 'https://btc-testground.vercel.app/calculators/dca',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Dollar Cost Averaging Calculator",
      "description": "Plan and calculate DCA investment strategies for cryptocurrencies",
      "url": "https://btc-testground.vercel.app/calculators/dca",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web Browser",
      "featureList": [
        "DCA strategy planning",
        "Average cost calculation",
        "Investment schedule optimization",
        "Portfolio growth projection",
        "Historical data analysis"
      ],
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
  },
  staking: {
    title: 'Crypto Staking Calculator | Ethereum & Solana Staking Rewards Calculator',
    description: 'Calculate your crypto staking rewards for Ethereum, Solana, and other cryptocurrencies. Estimate annual yields, compound interest, and staking profits with live APY rates.',
    keywords: 'staking calculator, crypto staking rewards, ethereum staking, solana staking, staking yield calculator, crypto passive income calculator, staking APY calculator, crypto rewards calculator, proof of stake calculator',
    url: 'https://btc-testground.vercel.app/calculators/staking',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Crypto Staking Calculator",
      "description": "Calculate staking rewards and yields for various cryptocurrencies",
      "url": "https://btc-testground.vercel.app/calculators/staking",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web Browser",
      "featureList": [
        "Staking rewards calculation",
        "APY yield estimation",
        "Compound interest modeling",
        "Multiple cryptocurrency support",
        "Time-based projections"
      ],
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
  },
  mining: {
    title: 'Bitcoin Mining Calculator | Crypto Mining Profitability Calculator 2024',
    description: 'Calculate Bitcoin mining profitability with our advanced mining calculator. Factor in electricity costs, hash rate, difficulty, and hardware costs for accurate mining ROI.',
    keywords: 'bitcoin mining calculator, crypto mining profitability, mining profit calculator, bitcoin mining profit, mining ROI calculator, hash rate calculator, mining hardware calculator, bitcoin mining ROI, crypto mining income',
    url: 'https://btc-testground.vercel.app/calculators/mining',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Bitcoin Mining Calculator",
      "description": "Calculate cryptocurrency mining profitability and ROI",
      "url": "https://btc-testground.vercel.app/calculators/mining",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web Browser",
      "featureList": [
        "Mining profitability calculation",
        "Electricity cost analysis",
        "Hash rate optimization",
        "Hardware ROI calculation",
        "Difficulty adjustment modeling"
      ],
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
  }
};