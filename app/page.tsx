"use client";

import dynamic from "next/dynamic";
const AppShell = dynamic(() => import("../src/App"), { ssr: false });

export default function Page() {
  return <AppShell />;
}