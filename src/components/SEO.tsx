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
    title: 'Live Bitcoin Price (BTC/USDT) | Real-Time Crypto Tracker for BTC, ETH, SOL',
    description: 'Track Bitcoin (BTC), Ethereum (ETH), and Solana (SOL) prices in real-time with our professional crypto price tracker. Live updates, price breakdowns, and crypto analysis tools powered by Binance WebSocket.',
    keywords: 'bitcoin price, crypto tracker, BTC USDT, ethereum price, solana price, live crypto prices, cryptocurrency tracker, binance api, real time crypto, bitcoin price today, bitcoin price live, btc price prediction, crypto market cap, digital currency prices, crypto portfolio tracker, bitcoin investment tracker, crypto price alerts, btc to usd converter',
    url: 'https://btc-testground.vercel.app/'
  },
  calculators: {
    title: 'Free Crypto Calculators | Bitcoin Profit, DCA, Mining & Staking Calculator Tools',
    description: 'Professional cryptocurrency calculators for Bitcoin and crypto profits, dollar cost averaging (DCA), mining profitability, and staking rewards. Free crypto tools with live market data.',
    keywords: 'crypto calculator, bitcoin profit calculator, DCA calculator, mining calculator, staking calculator, cryptocurrency profit, btc profit calculator, crypto roi calculator, bitcoin investment calculator, crypto tools, cryptocurrency calculator suite, bitcoin trading calculator',
    url: 'https://btc-testground.vercel.app/calculators'
  },
  profit: {
    title: 'Bitcoin Profit Calculator | Crypto Investment ROI Calculator with Live Prices',
    description: 'Calculate your Bitcoin and cryptocurrency investment profits with our advanced profit calculator. Track ROI, fees, and net gains for BTC, ETH, SOL with real-time market data.',
    keywords: 'bitcoin profit calculator, crypto profit calculator, investment ROI calculator, bitcoin ROI, cryptocurrency profit, crypto gains calculator, btc investment calculator, trading profit calculator, crypto return calculator, bitcoin investment tracker',
    url: 'https://btc-testground.vercel.app/calculators/profit'
  },
  dca: {
    title: 'Dollar Cost Averaging Calculator | Bitcoin DCA Strategy Calculator & Planner',
    description: 'Plan your Bitcoin DCA strategy with our dollar cost averaging calculator. Calculate optimal investment schedules, average costs, and long-term portfolio growth with historical data.',
    keywords: 'DCA calculator, dollar cost averaging, bitcoin DCA, crypto DCA strategy, average cost calculator, investment strategy calculator, bitcoin averaging, crypto investment plan, DCA strategy bitcoin, systematic investment calculator',
    url: 'https://btc-testground.vercel.app/calculators/dca'
  },
  staking: {
    title: 'Crypto Staking Calculator | Ethereum & Solana Staking Rewards Calculator',
    description: 'Calculate your crypto staking rewards for Ethereum, Solana, and other cryptocurrencies. Estimate annual yields, compound interest, and staking profits with live APY rates.',
    keywords: 'staking calculator, crypto staking rewards, ethereum staking, solana staking, staking yield calculator, crypto passive income calculator, staking APY calculator, crypto rewards calculator, proof of stake calculator',
    url: 'https://btc-testground.vercel.app/calculators/staking'
  },
  mining: {
    title: 'Bitcoin Mining Calculator | Crypto Mining Profitability Calculator 2024',
    description: 'Calculate Bitcoin mining profitability with our advanced mining calculator. Factor in electricity costs, hash rate, difficulty, and hardware costs for accurate mining ROI.',
    keywords: 'bitcoin mining calculator, crypto mining profitability, mining profit calculator, bitcoin mining profit, mining ROI calculator, hash rate calculator, mining hardware calculator, bitcoin mining ROI, crypto mining income',
    url: 'https://btc-testground.vercel.app/calculators/mining'
  }
};