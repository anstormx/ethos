"use client";

import WalletList from "@/components/walletList";
import { useIsMounted } from "@/hooks/useIsMounted";
import Link from "next/link";
import { Fragment } from "react";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected, address } = useAccount();
  const isMounted = useIsMounted();

  if (!isMounted) return null;

  return (
    <div className="container mx-auto max-h-[80vh] px-4 py-48 text-center">
      <h1 className="mx-auto mb-6 max-w-5xl text-7xl font-semibold">
        Create trusted and secure
        <span className="relative text-blue-600"> ERC-4337 </span> smart
        contract wallet.
      </h1>

      <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-700">
        Experience the seamless power of blockchain technology with{" "}
        <span className="font-semibold">Ethos Wallet</span>, the ultimate
        platform for creating and managing smart wallets.
      </p>

      <div className="flex justify-center space-x-4">
        <Link
          href="/createPasskey"
          className="rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition duration-300 hover:bg-blue-700"
        >
          Create P256-Wallet
        </Link>
        <Link
          href="/createWallet"
          className="flex items-center rounded-full border border-blue-600 bg-white px-6 py-3 font-semibold text-blue-600 transition duration-300 hover:bg-blue-50"
        >
          Create EOA-Wallet
        </Link>
      </div>
    </div>
  );
}
