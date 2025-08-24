import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <title>Crypto Profit Calculator — BTC, ETH, SOL | BTCUSDT.live</title>

          {/* Primary */}
          <meta name="description" content="Accurate Crypto Profit Calculator for BTC, ETH, SOL and other pairs. Live Binance prices, adjustable fee modes (Sell/Buy/Both), USD↔coin toggles, and instant net profit & ROI calculations for traders and hodlers." />
          <meta name="keywords" content="crypto profit calculator, BTC profit calculator, ETH profit calculator, SOL profit calculator, live crypto prices, Binance price, trading fees calculator, crypto ROI, crypto profit percent, crypto calculator, BTCUSDT" />
          <meta name="author" content="BTCUSDT.live" />
          <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
          <link rel="canonical" href="https://www.btcusdt.live/" />

          {/* Open Graph */}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="BTCUSDT.live" />
          <meta property="og:title" content="Crypto Profit Calculator — BTC, ETH, SOL | BTCUSDT.live" />
          <meta property="og:description" content="Live Binance prices, fee modes (Sell/Buy/Both), USD/coin toggles. Quickly calculate net profit and ROI for crypto trades." />
          <meta property="og:url" content="https://www.btcusdt.live/" />
          <meta property="og:image" content="https://www.btcusdt.live/og-image.png" />
          <meta property="og:image:alt" content="BTCUSDT.live — Crypto Profit Calculator preview" />

          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@BTCUSDT_live" />
          <meta name="twitter:creator" content="@BTCUSDT_live" />
          <meta name="twitter:title" content="Crypto Profit Calculator — BTC, ETH, SOL | BTCUSDT.live" />
          <meta name="twitter:description" content="Live Binance prices, fee modes, USD/coin toggles. Fast, accurate crypto profit & ROI calculations." />
          <meta name="twitter:image" content="https://www.btcusdt.live/twitter-image.png" />

          {/* Misc */}
          <meta name="theme-color" content="#0f172a" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="manifest" href="/site.webmanifest" />
          <link rel="alternate" href="https://www.btcusdt.live/" hreflang="en" />

          {/* JSON-LD structured data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "WebSite",
                    "@id": "https://www.btcusdt.live/#website",
                    "url": "https://www.btcusdt.live/",
                    "name": "BTCUSDT.live",
                    "description": "Live crypto profit calculator with Binance prices, fee modes, and USD/coin toggles.",
                    "publisher": {
                      "@type": "Organization",
                      "name": "BTCUSDT.live",
                      "logo": {
                        "@type": "ImageObject",
                        "url": "https://www.btcusdt.live/logo.png"
                      }
                    },
                    "potentialAction": {
                      "@type": "SearchAction",
                      "target": "https://www.btcusdt.live/?s={search_term_string}",
                      "query-input": "required name=search_term_string"
                    }
                  },
                  {
                    "@type": "WebApplication",
                    "@id": "https://www.btcusdt.live/#app",
                    "name": "Crypto Profit Calculator",
                    "url": "https://www.btcusdt.live/",
                    "description": "Calculate net crypto profit using live Binance prices, adjustable fee modes, and USD/coin toggles.",
                    "applicationCategory": "FinanceApplication",
                    "operatingSystem": "Web"
                  }
                ]
              })
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;