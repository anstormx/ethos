import { Wallet } from "@prisma/client";
import { useEffect, useState } from "react";
import Icon from "./icon";
import Link from "next/link";
import { isAddress } from "ethers";

type WalletWithTxnsCount = Wallet & {
  _count: {
    transactions: number;
  };
};

export default function WalletList({ address }: { address: string }) {
  // Declare a state variable wallets which keeps track of WalletWithTxnxCount for a given EOA address
  const [wallets, setWallets] = useState<WalletWithTxnsCount[]>([]);

  useEffect(() => {
    fetch(`/routes/fetchWallets?address=${address}`)
      .then((response) => response.json())
      .then((data) => setWallets(data));
  }, [address]);

  return (
    <main className="flex flex-col items-center justify-center gap-5">
      <h1 className="text-5xl font-bold">Your Wallets</h1>

      {wallets.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-600 p-6">
          <p className="text-lg text-gray-700">
            You currently have no smart contract wallets
          </p>
        </div>
      ) : (
        <div className="grid w-[110%] grid-cols-2 gap-4">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className="flex flex-col rounded-lg border border-gray-800"
            >
              <div className="flex items-center justify-between gap-4 rounded-t-lg bg-gray-800 p-2 font-mono">
                <p className="ml-2 text-gray-300">
                  Pending Txns: {wallet._count.transactions}
                </p>
                <div className="mr-4 flex items-center gap-2 rounded-full bg-gray-300 px-4 py-1">
                  {wallet.isDeployed ? (
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                  )}

                  <p className="text-sm font-medium text-gray-800">
                    {wallet.isDeployed ? "Deployed" : "Not Deployed"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col divide-y divide-gray-600 py-2">
                {isAddress(wallet.address) && (
                  <div
                    key={`${wallet.address}-${wallet.signer}`}
                    className="flex items-center justify-center gap-2 py-2"
                  >
                    <Icon type="user" />
                    <Link
                      href={`/${wallet.address}`}
                      className="mr-[2%] text-gray-700 transition duration-200 hover:text-gray-500"
                    >
                      <p className="font-mono">{wallet.address}</p>
                    </Link>
                    <Link
                      href={`https://sepolia.etherscan.io/address/${wallet.address}`}
                      target="_blank"
                      className="text-blue-600 transition duration-200 hover:text-blue-700"
                    >
                      Etherscan
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
