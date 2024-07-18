"use client";

import WalletList from "@/components/walletList";
import { useIsMounted } from "@/hooks/useIsMounted";
import { Fragment } from "react";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected, address } = useAccount();
  const isMounted = useIsMounted();

  if (!isMounted) return null;

  return (
    <main className="flex flex-col py-[3%]">
      <div className="flex flex-col h-full gap-6 justify-center items-center">
        <Fragment>
          {isConnected? 
            (address && <WalletList address={address} />)
          : 
          <label className="text-xl mt-[2%] font-semibold">
            please connect your wallet
          </label>
          }
        </Fragment>
      </div>
    </main>
  );
}