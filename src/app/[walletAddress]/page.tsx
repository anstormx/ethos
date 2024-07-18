"use client";

import { getUserOpForETHTransfer } from "@/utils/getUserOpForETHTransfer";
import { parseEther } from "ethers/utils";
import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import getUserOpHash from "@/utils/getUserOpHash";
import TransactionsList from "@/components/transactionList";
import { Hex } from "@/interface/types";
import { toast } from "react-toastify";
import { isAddress } from "ethers";


export default function WalletPage({params: { walletAddress }}: {params: { walletAddress: string };}) {
    const [amount, setAmount] = useState<number>(0);
    const [toAddress, setToAddress] = useState("");
    const { address: userAddress } = useAccount();
    // Client for current EOA wallet
    const { data: walletClient } = useWalletClient();
    const [loading, setLoading] = useState(false);

    const fetchUserOp = async () => {
        try {
            const response = await fetch(
                `/routes/fetchWallet?walletAddress=${walletAddress}`
            );
            const data = await response.json();

            if (data.error) throw new Error(data.error);

            const amountBigInt = parseEther(amount.toString());

            // Get the user operation for the ETH transfer
            const userOp = await getUserOpForETHTransfer(
                walletAddress as Hex,
                data.signers,
                data.salt,
                toAddress,
                amountBigInt,
                data.isDeployed
            );

            console.log("User operation fetched: ", userOp);

            if (!userOp) throw new Error("Could not fetch user operation");

            // Return the user operation
            return userOp;
        } catch (e) {
            toast.error("Could not fetch user operation, check console for more details");
            console.log(e);
        }
    };

    const createTransaction = async () => {
        try {
            setLoading(true);
        
            if (!amount || (amount<0)) throw new Error("Please enter a valid amount");
            if (!toAddress || !isAddress(toAddress)) throw new Error("Please enter a valid address");
        
            const userOp = await fetchUserOp();
            if (!userOp) throw new Error("Could not fetch userOp");
        
            const userOpHash = await getUserOpHash(userOp);
            
            // Sign the user operation hash using the wallet client
            const signature = await walletClient?.signMessage({                  //webauthn
                message: { raw: userOpHash as `0x${string}` },
            });
            
            const response = await fetch("/routes/createTransaction", {
                method: "POST",
                body: JSON.stringify({
                walletAddress,
                userOp,
                signature,
                signerAddress: userAddress,
                }, (key, value) =>
                    typeof value === 'bigint'
                        ? value.toString()
                        : value
                ),
                headers: {
                "Content-Type": "application/json",
                },
            });
        
            const data = await response.json();
            if (data.error) throw new Error(data.error);
        
            toast.success("Transaction created successfully");

            window.location.reload();
        } catch (err) {
            console.log(err);
            toast.error(`${err}`);
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col py-6 items-center gap-5">
            <h1 className="text-5xl font-bold">Manage Wallet</h1>
            <h3 className="text-xl font-medium border-b border-gray-700">
                {walletAddress}
            </h3>
        
            <p className="text-lg font-bold">Send ETH</p>
        
            <input
                className="rounded-lg p-2 text-slate-700"
                placeholder="0x0"
                onChange={(e) => setToAddress(e.target.value)}
            />
            <input
                className="rounded-lg p-2 text-slate-700"
                type="number"
                placeholder="1"
                onChange={(e) => {
                if (e.target.value === "") {
                    setAmount(0);
                    return;
                }
                setAmount(parseFloat(e.target.value));
                }}
            />
            <button
                className="bg-blue-500 mx-auto hover:bg-blue-700 disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50 hover:transition-colors text-white font-bold py-2 w-[8%] px-4 rounded-lg transition duration-200"
                onClick={createTransaction}
            >
                {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-l-white items-center justify-center mx-auto" />
                ) : (
                `Create Txn`
                )}
            </button>
            {userAddress && (
                <TransactionsList address={userAddress} walletAddress={walletAddress} />
            )}
        </div>
    );
}