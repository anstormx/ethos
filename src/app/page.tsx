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
    <div className="container mx-auto px-4 py-48 text-center max-h-[80vh]">
      <h1 className="text-7xl font-semibold mb-6 max-w-5xl mx-auto">
        Create trusted and secure
        <span className="text-blue-600 relative">
          {" "}
          ERC-4337{" "}
        </span>{" "}
        smart contract wallet.
      </h1>

      <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
        Experience the seamless power of blockchain technology with <span className="font-semibold">Ethos Wallet</span>,
        the ultimate platform for creating and managing smart wallets.
      </p>

      <div className="flex justify-center space-x-4">
        <Link
          href="/createPasskey"
          className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition duration-300"
        >
          Create P256-Wallet
        </Link>
        <Link
          href="/createWallet"
          className="bg-white text-blue-600 px-6 py-3 rounded-full font-semibold border border-blue-600 hover:bg-blue-50 transition duration-300 flex items-center"
        >
          Create EOA-Wallet
        </Link>
      </div>
    </div>
  );
}
