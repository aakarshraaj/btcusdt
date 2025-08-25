import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <title>BTCUSDT Live Price & Crypto Profit Calculator | Mining & DCA Tools</title>

          {/* Primary */}
          <meta name="description" content="Accurate Crypto Profit Calculator for BTC, ETH, SOL and other pairs. Live BTCUSDT price, mining calculator, dollar cost averaging (DCA) calculator, and crypto profit calculator for traders and hodlers." />
          <meta name="keywords" content="btcusdt live, btcusdt live price, crypto profit calculator, mining calculator, nicehash calculator, dollar cost averaging calculator, cryptoprofitcalculator, bit coin profit calculator, mining profitability calculator, free crypto calculator, cryptocalculator" />
          <meta name="author" content="BTCUSDT.live" />
          <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
          <link rel="canonical" href="https://www.btcusdt.live/" />

          {/* Open Graph */}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="BTCUSDT.live" />
          <meta property="og:title" content="BTCUSDT Live Price & Crypto Profit Calculator | Mining, DCA & More" />
          <meta property="og:description" content="Free BTCUSDT live price, crypto profit calculator, mining profitability calculator, and dollar cost averaging calculator. All-in-one cryptocalculator for traders and miners." />
          <meta property="og:url" content="https://www.btcusdt.live/" />
          <meta property="og:image" content="https://www.btcusdt.live/og-image.png" />
          <meta property="og:image:alt" content="BTCUSDT.live — Crypto Profit Calculator preview" />

          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@BTCUSDT_live" />
          <meta name="twitter:creator" content="@BTCUSDT_live" />
          <meta name="twitter:title" content="BTCUSDT Live Price & Crypto Profit Calculator | Mining, DCA & More" />
          <meta name="twitter:description" content="Free crypto calculator suite with BTCUSDT live price, profit calculation, mining profitability tools and dollar cost averaging tracker." />
          <meta name="twitter:image" content="https://www.btcusdt.live/twitter-image.png" />

          {/* Misc */}
          <meta name="theme-color" content="#0f172a" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="manifest" href="/site.webmanifest" />
          <link rel="alternate" href="https://www.btcusdt.live/" hrefLang="en" />

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
                    "description": "Live BTCUSDT price tracker and crypto calculator suite: profit calculator, mining calculator, and dollar cost averaging tools.",
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
                    "name": "Crypto Profit Calculator & BTCUSDT Live Price",
                    "url": "https://www.btcusdt.live/",
                    "description": "Calculate crypto profit, mining profitability, and dollar cost averaging with live BTCUSDT price tracker.",
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