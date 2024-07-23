"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full px-[3%] py-[1%] flex justify-between items-center">
      <div className="flex-1"></div>
      <div className="flex-1 flex justify-center">
        <ul className="flex items-center space-x-8 bg-white rounded-full shadow-2xl px-6 py-2">
          <li>
            <Link href="/" className="text-gray-700 font-semibold text-sm hover:text-gray-800 transition duration-200">
              Home
            </Link>
          </li>
          <li>
            <Link href="/wallets" className="text-gray-700 font-semibold text-sm hover:text-gray-800 transition duration-200">
              Wallets
            </Link>
          </li>
          <li>
            <Link href="/createPasskey" className="text-gray-700 font-semibold text-sm hover:text-gray-800 transition duration-200">
              P256-Wallet
            </Link>
          </li>
          <li>
            <Link href="/createWallet" className="text-gray-700 font-semibold text-sm hover:text-gray-800 transition duration-200">
              EOA-Wallet
            </Link>
          </li>
        </ul>
      </div>
      <div className="flex-1 flex justify-end">
        <ConnectButton />
      </div>
    </nav>
  );
}