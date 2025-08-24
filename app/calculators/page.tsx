"use client";

import dynamic from "next/dynamic";
import Head from "next/head";

const CryptoProfitCalculator = dynamic(() => import("../../../src/components/CryptoProfitCalculator"), { ssr: false });

export default function CalculatorsPage() {
  return (
    <>
      <Head>
        <title>Crypto Profit Calculator — BTC, ETH, SOL | BTCUSDT.live</title>
        <meta name="description" content="Accurate Crypto Profit Calculator for BTC, ETH, SOL. Live Binance prices, fee modes, USD↔coin toggles, and instant net profit & ROI calculations." />
        <link rel="canonical" href="https://www.btcusdt.live/calculators" />
      </Head>

      <main style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
        <h1>Crypto Profit Calculator</h1>
        <CryptoProfitCalculator />
      </main>
    </>
  );
}