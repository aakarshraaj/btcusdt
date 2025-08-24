import dynamic from "next/dynamic";
import Head from "next/head";

const AppShell = dynamic(() => import("../src/App"), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <title>BTCUSDT.live — Live Ticker</title>
        <meta name="description" content="Live crypto ticker — BTC, ETH, SOL. Minimal landing screen for quick price monitoring." />
        <link rel="canonical" href="https://www.btcusdt.live/" />
      </Head>
      <main style={{ height: "100vh" }}>
        <AppShell />
      </main>
    </>
  );
}