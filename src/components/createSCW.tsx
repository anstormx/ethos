"use client";

import { useEffect, useState } from "react";
import { isAddress } from "ethers/address";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAccount } from "wagmi";

export default function CreateSCW() {
  const [signer, setSigner] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const { address } = useAccount();

  const router = useRouter();

  useEffect(() => {
    if (address) {
      setSigner(address);
    }
  }, [address]);

  const onCreateSCW = async () => {
    try {
      setLoading(true);

      // Check if the signer is a valid Ethereum address
      if (isAddress(signer) === false) {
        throw new Error(`Invalid address: ${signer}`);
      }

      toast.info(`Creating wallet for ${signer}`);

      const response = await fetch("/routes/createWallet", {
        method: "POST",
        body: JSON.stringify({
          signer,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(JSON.stringify(data.error));
      }

      toast.success(`Wallet created: ${data.address}`);

      router.push(`/wallets/${data.address}`);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col py-6 items-center gap-5">
      <h1 className="text-5xl font-bold">Create EOA-Wallet</h1>
      <p className="text-gray-700 text-lg">
        Create a new wallet using an Ethereum address
      </p>
      <div className="flex flex-col gap-6 max-w-sm w-full">
        <input
          type="text"
          className="rounded-lg p-2 w-full text-slate-700"
          placeholder="0x0"
          value={signer}
          onChange={(event) => {
            setSigner(event.target.value);
          }}
        />
        {loading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-l-white items-center justify-center mx-auto" />
        ) : (
          <button
            className="bg-blue-600 mx-auto hover:bg-blue-700 disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50 transition text-white font-bold py-2 w-fit px-4 rounded-full duration-300"
            onClick={onCreateSCW}
          >
            create wallet
          </button>
        )}
      </div>
    </main>
  );
}
