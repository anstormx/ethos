"use client";

import { getUserOpForETHTransfer } from "@/utils/getUserOpForETHTransfer";
import { parseEther, isAddress } from "ethers";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import TransactionsList from "@/components/transactionList";
import { Hex, UserOperationStruct } from "@/interface/types";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import { entryPointContract } from "@/utils/getContracts";
import { createBundler } from "@biconomy/account";
import { ENTRY_POINT_ADDRESS } from "@/utils/constants";

function biginttostring(userOpFinal: UserOperationStruct) {
  return Object.fromEntries(
    Object.entries(userOpFinal).map(([key, value]) => [
      key,
      typeof value === "bigint" ? value.toString() : value,
    ]),
  ) as UserOperationStruct;
}

export default function WalletPage({
  params: { walletAddress },
}: {
  params: { walletAddress: string };
}) {
  const [amount, setAmount] = useState<number>(0);
  const [toAddress, setToAddress] = useState("");
  const { address: userAddress } = useAccount();
  const [loading, setLoading] = useState(false);
  const [newTransactionCreated, setNewTransactionCreated] = useState(false);

  const fetchUserOp = async () => {
    try {
      const response = await fetch(
        `/routes/fetchWallet?walletAddress=${walletAddress}`,
      );
      const data = await response.json();

      if (data === null || data.error) {
        toast.error("Could not fetch wallet data");
        return null;
      }

      const amountBigInt = parseEther(amount.toString());

      // Get the user operation for the ETH transfer
      const userOp = await getUserOpForETHTransfer(
        walletAddress as Hex,
        data.signer,
        data.salt,
        toAddress,
        amountBigInt,
        data.isDeployed,
      );

      if (!userOp) throw new Error("Could not fetch user operation");

      // Return the user operation
      return userOp;
    } catch (e) {
      toast.error(
        "Could not fetch user operation, check console for more details",
      );
      console.log(e);
    }
  };

  const createTransaction = async () => {
    try {
      setLoading(true);

      if (!amount || amount < 0) throw new Error("Please enter a valid amount");
      if (!toAddress || !isAddress(toAddress))
        throw new Error("Please enter a valid address");

      const userOp = await fetchUserOp();
      if (!userOp) {
        setLoading(false);
        return;
      }

      const userOpHash = await entryPointContract.getUserOpHash(
        userOp as UserOperationStruct,
      );

      if (!window.ethereum) throw new Error("Metamask not found");
      const metamaskProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await metamaskProvider.getSigner();
      const signature = await signer.signMessage(ethers.getBytes(userOpHash));
      userOp.signature = signature as Hex;

      const bundler = await createBundler({
        bundlerUrl: `${process.env.NEXT_PUBLIC_BICONOMY_BUNDLERURL}`,
        chainId: 11155111,
        entryPointAddress: ENTRY_POINT_ADDRESS,
      });

      const userOpString = biginttostring(userOp as UserOperationStruct);
      const userOpGasResponse = await bundler.estimateUserOpGas(userOpString);

      console.log("userOpGasResponse", userOpGasResponse);

      Object.assign(userOp, {
        callGasLimit: BigInt(userOpGasResponse.callGasLimit),
        verificationGasLimit: BigInt(userOpGasResponse.verificationGasLimit),
        maxFeePerGas: BigInt(userOpGasResponse.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(userOpGasResponse.maxPriorityFeePerGas),
        preVerificationGas: BigInt(userOpGasResponse.preVerificationGas),
      });

      const userOpHashFinal = await entryPointContract.getUserOpHash(
        userOp as UserOperationStruct,
      );
      const signatureFinal = await signer.signMessage(
        ethers.getBytes(userOpHashFinal),
      );
      userOp.signature = signatureFinal as Hex;

      const balance = await metamaskProvider.getBalance(userOp.sender);
      console.log("balance", balance);

      const requiredFunds =
        BigInt(userOp.callGasLimit) * BigInt(userOp.maxFeePerGas) +
        BigInt(userOp.verificationGasLimit) * BigInt(userOp.maxFeePerGas) +
        (BigInt(userOp.preVerificationGas) *
          BigInt(userOp.maxFeePerGas) * // To prevent gas running out
          BigInt(11)) /
          BigInt(10) +
        BigInt(ethers.parseEther(amount.toString()));

      if (balance < requiredFunds) {
        const amountToFund = requiredFunds - balance;
        toast.warn(
          `Account needs funding of ${ethers.formatEther(amountToFund)} ETH`,
        );

        if (!window.ethereum) throw new Error("Metamask not found");
        const metamaskProvider = new ethers.BrowserProvider(window.ethereum);
        const signer = await metamaskProvider.getSigner();
        const tx = await signer.sendTransaction({
          to: userOp.sender,
          value: amountToFund,
        });

        await tx.wait();

        toast.success("Account funded successfully");
      }

      const response = await fetch("/routes/createTransaction", {
        method: "POST",
        body: JSON.stringify(
          {
            walletAddress,
            userOp,
            signature,
            signerAddress: userAddress,
          },
          (key, value) =>
            typeof value === "bigint" ? value.toString() : value,
        ),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      toast.success("Transaction created successfully");
      setNewTransactionCreated(true);
      setLoading(false);

      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while creating the userOp");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (newTransactionCreated) {
      setNewTransactionCreated(false);
    }
  }, [newTransactionCreated]);

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <h1 className="text-5xl font-bold">Manage Wallet</h1>
      <h3 className="text-xl font-medium text-gray-700">{walletAddress}</h3>

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
        className="mx-auto w-[8%] min-w-40 rounded-full bg-blue-600 px-4 py-2 font-bold text-white transition duration-300 hover:bg-blue-700 disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50"
        onClick={createTransaction}
      >
        {loading ? (
          <div className="mx-auto h-6 w-6 animate-spin items-center justify-center rounded-full border-4 border-gray-300 border-l-white" />
        ) : (
          `Create userOp`
        )}
      </button>
      {userAddress && (
        <TransactionsList address={userAddress} walletAddress={walletAddress} />
      )}
    </div>
  );
}
