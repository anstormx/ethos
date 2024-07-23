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
    <main className="flex flex-col items-center gap-5 py-6">
      <h1 className="text-5xl font-bold">Create EOA-Wallet</h1>
      <p className="text-lg text-gray-700">
        Create a new wallet using an Ethereum address
      </p>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <input
          type="text"
          className="w-full rounded-lg p-2 text-slate-700"
          placeholder="0x0"
          value={signer}
          onChange={(event) => {
            setSigner(event.target.value);
          }}
        />
        {loading ? (
          <div className="mx-auto h-6 w-6 animate-spin items-center justify-center rounded-full border-b-2 border-l-white" />
        ) : (
          <button
            className="mx-auto w-fit rounded-full bg-blue-600 px-4 py-2 font-bold text-white transition duration-300 hover:bg-blue-700 disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50"
            onClick={onCreateSCW}
          >
            create wallet
          </button>
        )}
      </div>
    </main>
  );
}
