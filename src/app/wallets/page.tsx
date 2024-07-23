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
      <div className="flex h-full flex-col items-center justify-center gap-6">
        <Fragment>
          {isConnected ? (
            address && <WalletList address={address} />
          ) : (
            <label className="mt-[2%] text-xl font-semibold">
              Please connect your EOA wallet
            </label>
          )}
        </Fragment>
      </div>
    </main>
  );
}
