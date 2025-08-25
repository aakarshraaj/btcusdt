import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  noindex?: boolean;
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
  noindex = false
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

  }, [title, description, keywords, image, url, type, noindex]);

  return null;
}

// Pre-defined SEO configurations for different pages
export const seoConfigs = {
  home: {
    title: defaultSEO.title,
    description: defaultSEO.description,
    keywords: defaultSEO.keywords,
    url: defaultSEO.url
  },
  calculators: {
    title: 'Crypto Calculators | Bitcoin Profit, DCA, Mining & Staking Calculator',
    description: 'Free cryptocurrency calculators for Bitcoin and crypto profits, dollar cost averaging (DCA), mining profitability, and staking rewards. Professional crypto tools.',
    keywords: 'crypto calculator, bitcoin profit calculator, DCA calculator, mining calculator, staking calculator, cryptocurrency profit, btc profit calculator, crypto roi calculator, bitcoin investment calculator',
    url: 'https://btc-testground.vercel.app/calculators'
  },
  profit: {
    title: 'Bitcoin Profit Calculator | Crypto Investment ROI Calculator',
    description: 'Calculate your Bitcoin and cryptocurrency investment profits with our advanced profit calculator. Track ROI, fees, and net gains for BTC, ETH, SOL and more.',
    keywords: 'bitcoin profit calculator, crypto profit calculator, investment ROI calculator, bitcoin ROI, cryptocurrency profit, crypto gains calculator, btc investment calculator',
    url: 'https://btc-testground.vercel.app/calculators/profit'
  },
  dca: {
    title: 'Dollar Cost Averaging Calculator | Bitcoin DCA Strategy Calculator',
    description: 'Plan your Bitcoin DCA strategy with our dollar cost averaging calculator. Calculate optimal investment schedules, average costs, and long-term portfolio growth.',
    keywords: 'DCA calculator, dollar cost averaging, bitcoin DCA, crypto DCA strategy, average cost calculator, investment strategy calculator, bitcoin averaging',
    url: 'https://btc-testground.vercel.app/calculators/dca'
  },
  staking: {
    title: 'Crypto Staking Calculator | Ethereum & Solana Staking Rewards',
    description: 'Calculate your crypto staking rewards for Ethereum, Solana, and other cryptocurrencies. Estimate annual yields, compound interest, and staking profits.',
    keywords: 'staking calculator, crypto staking rewards, ethereum staking, solana staking, staking yield calculator, crypto passive income calculator',
    url: 'https://btc-testground.vercel.app/calculators/staking'
  },
  mining: {
    title: 'Bitcoin Mining Calculator | Crypto Mining Profitability Calculator',
    description: 'Calculate Bitcoin mining profitability with our advanced mining calculator. Factor in electricity costs, hash rate, difficulty, and hardware costs.',
    keywords: 'bitcoin mining calculator, crypto mining profitability, mining profit calculator, bitcoin mining profit, mining ROI calculator, hash rate calculator',
    url: 'https://btc-testground.vercel.app/calculators/mining'
  }
};