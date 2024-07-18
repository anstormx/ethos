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
    <main className="flex flex-col justify-center items-center gap-5">
      <h1 className="text-5xl font-bold">Your Wallets</h1>

      {wallets.length === 0 ? (
        <div className="flex justify-center items-center border-2 border-dashed p-6 rounded-lg">
          <p className="text-lg">
            You currently have no smart contract wallets
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 w-[110%]">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className="flex flex-col border border-gray-800 rounded-lg"
            >
              <div className="bg-gray-800 flex justify-between gap-4 items-center rounded-t-lg p-2 font-mono">
                <p className="text-gray-300 ml-2">
                  Pending Txns: {wallet._count.transactions}
                </p>
                <div className="bg-gray-300 rounded-full items-center px-4 py-1 flex gap-2 mr-4">
                  {wallet.isDeployed ? (
                    <div className="h-2 w-2 rounded-full bg-green-400" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                  )}

                  <p className="text-gray-800 text-sm font-medium">
                    {wallet.isDeployed ? "Deployed" : "Not Deployed"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col py-2 divide-y divide-gray-600">
                {isAddress(wallet.address) && (
                  <div
                    key={`${wallet.address}-${wallet.signer}`}
                    className="flex items-center justify-center gap-2 py-2"
                  >
                    <Icon type="user" />
                    <Link href={`/${wallet.address}`} className="text-gray-300 hover:text-gray-100 transition duration-200 mr-[2%]">
                      <p className="font-mono">{wallet.address}</p>
                    </Link>
                    <Link
                      href={`https://sepolia.etherscan.io/address/${wallet.address}`}
                      target="_blank"
                      className="text-blue-500 hover:text-blue-400 transition duration-200"
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