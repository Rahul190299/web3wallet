"use client"
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { WalletGenerator } from "@/components/WalletGenerator";
export default function Home() {
  return (
    <div className="flex max-w-7xl mx-auto flex-col gap-4 p-4 justify-center  font-sans">
      <Navbar/>
      <WalletGenerator/>
    </div>
  );
}
