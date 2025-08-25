"use client";

import React from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import "../../../src/components/CryptoProfitCalculator";

// Update the import path below to the correct relative path where CryptoProfitCalculator.tsx exists
const CryptoProfitCalculator = dynamic(() => import("../../components/CryptoProfitCalculator"), { ssr: false });

export default function CalculatorsPage() {
  return (
    <>
      <Head>
        <title>Crypto Profit Calculator — BTC, ETH, SOL | BTCUSDT.live</title>
        <meta name="description" content="Accurate Crypto Profit Calculator for BTC, ETH, SOL. Live Binance prices, fee modes, USD↔coin toggles, and instant net profit & ROI calculations." />
        <link rel="canonical" href="https://www.btcusdt.live/calculators" />
      </Head>

      <main style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ fontSize: 34, marginBottom: 8 }}>Crypto Profit Calculator</h1>
        <p style={{ color: "#6b7280", marginBottom: 12 }}>
          Live Binance prices, fee modes (Sell Only / Buy Only / Both), USD ↔ coin toggles, and instant net profit & ROI calculations.
        </p>

        <section style={{ background: "#fff", padding: 12, borderRadius: 8, marginBottom: 28 }}>
          <CryptoProfitCalculator />
        </section>

        <article style={{ lineHeight: 1.6, color: "#374151" }}>
          {/* Optional: include SEO copy from content/seo-home.md here */}
        </article>
      </main>
    </>
  );
}