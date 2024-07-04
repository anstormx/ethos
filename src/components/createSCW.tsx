"use client";

import {
  useEffect,
  useRef,
  useState
} from "react";
import {
  useAccount
} from "wagmi";
import {
  isAddress
} from "ethers/address";
import {
  useRouter
} from "next/navigation";
import Icon from "@/components/icon";
import { toast } from "react-toastify";

export default function CreateSCW() {
  const [signers, setSigners] = useState < string[] > ([]);
  const [loading, setLoading] = useState(false);
  const {
    address
  } = useAccount();
  const lastInput = useRef < HTMLInputElement | null > (null);

  const router = useRouter();

  useEffect(() => {
    setSigners([address as string]);
  }, [address]);

  useEffect(() => {
    if (lastInput.current) {
      lastInput.current.focus();
    }
  }, [signers]);

  function addNewSigner() {
    setSigners((signers) => [...signers, ""]);
  }

  function removeSigner(index: number) {
    if (signers[index] === undefined) return;
    if (signers.length <= 1) return;
    if (signers[index].length > 0) return;
    const newSigners = [...signers];
    newSigners.splice(index, 1);
    setSigners(newSigners);
  }

  const onCreateSCW = async () => {
    try {
      setLoading(true);

      signers.forEach((signer) => {
        // Check if the signer is a valid Ethereum address
        if (isAddress(signer) === false) {
          throw new Error(`Invalid address: ${signer}`);
        }
      });

      console.log(signers);

      const response = await fetch("/routes/createWallet", {
        method: "POST",
        body: JSON.stringify({
          signers
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(response);

      const data = await response.json();
      if (data.error) {
        throw new Error(JSON.stringify(data.error));
      }

      toast.success(`Wallet created: ${data.address}`);

      router.push(`/`);
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
          <h1 className="text-5xl font-bold">gen wallet</h1>
          <p className="text-gray-400">
            enter the signer addresses for this smart wallet
          </p>
          <div className="flex flex-col gap-6 max-w-sm w-full">
            {signers.map((signer, index) => (
              <div key={signer} className="flex items-center gap-4">
                <input
                  type="text"
                  className="rounded-lg p-2 w-full text-slate-700"
                  placeholder="0x0"
                  value={signer}
                  ref={index === signers.length - 1 ? lastInput : null}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      addNewSigner();
                    } else if (event.key === "Backspace") {
                      removeSigner(index);
                    }
                  }}
                  onChange={(event) => {
                    const newSigners = [...signers];
                    newSigners[index] = event.target.value;
                    setSigners(newSigners);
                  }}
                />
    
                {index > 0 && (
                  <div
                    className="hover:scale-105 cursor-pointer"
                    onClick={() => removeSigner(index)}
                  >
                    <Icon type="xmark" />
                  </div>
                )}
              </div>
            ))}
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-l-white items-center justify-center mx-auto" />
            ) : (
              <div className="flex items-center justify-between">
                <button
                  className="bg-blue-500 mx-auto hover:bg-blue-700 disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50 hover:transition-colors text-white font-bold py-2 w-fit px-4 rounded-lg"
                  onClick={addNewSigner}
                >
                  new signer
                </button>
                <button
                  className="bg-blue-500 mx-auto hover:bg-blue-700 disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50 hover:transition-colors text-white font-bold py-2 w-fit px-4 rounded-lg"
                  onClick={onCreateSCW}
                >
                  create wallet
                </button>
              </div>
            )}
          </div>
        </main>

  );
}