"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex w-full items-center justify-between px-[3%] py-[1%]">
      <div className="flex-1"></div>
      <div className="flex flex-1 justify-center">
        <ul className="flex items-center space-x-8 rounded-full bg-white px-6 py-2 shadow-2xl">
          <li>
            <Link
              href="/"
              className="text-sm font-semibold text-gray-700 transition duration-200 hover:text-gray-800"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/wallets"
              className="text-sm font-semibold text-gray-700 transition duration-200 hover:text-gray-800"
            >
              Wallets
            </Link>
          </li>
          <li>
            <Link
              href="/createPasskey"
              className="text-sm font-semibold text-gray-700 transition duration-200 hover:text-gray-800"
            >
              P256-Wallet
            </Link>
          </li>
          <li>
            <Link
              href="/createWallet"
              className="text-sm font-semibold text-gray-700 transition duration-200 hover:text-gray-800"
            >
              EOA-Wallet
            </Link>
          </li>
        </ul>
      </div>
      <div className="flex flex-1 justify-end">
        <ConnectButton />
      </div>
    </nav>
  );
}
