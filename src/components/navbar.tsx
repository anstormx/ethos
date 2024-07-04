"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export default function Navbar() {
  return (
    <div className="w-full px-6 border-b border-b-gray-700 py-2 flex justify-between items-center">
      <div className="gap-4 flex">
        <Link href="/" className="text-3xl font-bold">
         ethos
        </Link>
      </div>
      <Link href="/createPasskey" className="hover:underline ml-[64%]  font-semibold text-lg">
        gen passkey
      </Link>
      <Link href="/createWallet" className="hover:underline ml-[0.5%]  font-semibold text-lg">
        gen wallet
      </Link>
      <ConnectButton />
    </div>
  );
}