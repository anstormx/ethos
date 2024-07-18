"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export default function Navbar() {
  return (
    <div className="w-full px-[3%] border-b-[1.5px] border-b-gray-700 py-[0.6%] flex justify-between items-center">
      <Link href="/" className="text-4xl font-bold">
        ethos
      </Link>
      <div className="flex items-center">
        <Link href="/createPasskey" className="hover:underline font-semibold text-lg mr-6">
          gen passkey
        </Link>
        <Link href="/createWallet" className="hover:underline font-semibold text-lg mr-6">
          gen wallet
        </Link>
        <ConnectButton />
      </div>
    </div>
  );
}