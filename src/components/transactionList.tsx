"use client";

import { TransactionWithPendingSigner } from "@/app/routes/fetchTransactions/route";
import { ENTRY_POINT_ADDRESS } from "@/utils/constants";
import { UserOperationStruct } from "@/interface/types";
import { useEffect, useState, useCallback } from "react";
import { useIsMounted } from "@/hooks/useIsMounted";
import { createBundler, UserOpResponse } from "@biconomy/account";
import { Prisma } from "@prisma/client";
import { toast } from "react-toastify";
import Icon from "./icon";

require("dotenv").config();

type TransactionWithWallet = Prisma.TransactionGetPayload<{
  include: { wallet: true };
}>;

interface TransactionListProps {
  address: string;
  walletAddress: string;
}

export default function TransactionsList({
  address,
  walletAddress,
}: TransactionListProps) {
  const isMounted = useIsMounted();

  const [walletTxns, setWalletTxns] = useState<TransactionWithPendingSigner[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch(
        `/routes/fetchTransactions?walletAddress=${walletAddress}`,
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setWalletTxns(data.transactions);
    } catch (error) {
      console.error(error);
      toast.error(
        "An error occurred while fetching transactions, check the console for more information",
      );
    }
  }, [walletAddress]);

  const sendTransaction = async (transaction: TransactionWithWallet) => {
    try {
      setLoading(true);

      // Get the user operation from the transaction
      const userOp = transaction.userOp as unknown as UserOperationStruct;

      console.log("userOp", userOp);

      const bundler = await createBundler({
        bundlerUrl: process.env.NEXT_PUBLIC_BICONOMY_BUNDLERURL as string,
        chainId: 11155111, // Sepolia chain ID
        entryPointAddress: ENTRY_POINT_ADDRESS,
      });

      const userOpResponse: UserOpResponse = await bundler.sendUserOp(userOp);

      console.log("userOpResponse", userOpResponse);

      console.log("Waiting for receipt...");

      await userOpResponse.wait();

      const receipt = await bundler.getUserOpReceipt(userOpResponse.userOpHash);

      console.log("receipt", receipt);

      const txHash = receipt?.receipt.transactionHash;

      if (txHash) console.log("txHash", txHash);

      // Mark the wallet as deployed by sending a POST request to the update-wallet-deployed endpoint
      await fetch("/routes/updateWalletDeployed", {
        method: "POST",
        body: JSON.stringify({
          walletId: transaction.wallet.id,
          transactionId: transaction.id,
          txHash,
        }),
      });

      // Alert the user that the transaction was sent successfully
      toast.success("Transaction sent successfully");
      setLoading(false);
      window.location.reload();
    } catch (e) {
      console.log(e);
      toast.error(
        "An error occurred while sending the transaction, check the console for more information",
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, address]);

  if (!isMounted) return null;

  return (
    <main className="flex flex-col items-center justify-center gap-5 p-10">
      <h1 className="text-5xl font-bold">Transactions</h1>

      {walletTxns.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-600 p-6">
          <p className="text-lg text-gray-700">
            You currently have no transactions
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {walletTxns.map((transaction) => (
            <div
              key={transaction.id}
              className="flex flex-col gap-2 rounded-lg border border-gray-800 p-2"
            >
              <span className="w-full rounded-t-lg bg-gray-700 p-2 text-center font-bold text-white">
                Transaction #{transaction.id}
              </span>
              <div className="flex flex-col gap-2">
                <div
                  key={transaction.signature}
                  className="flex gap-4 font-mono"
                >
                  <span>{transaction.signerAddress}</span>
                  <Icon type="check" />
                </div>

                {
                  transaction.txHash ? (
                    <button
                      className="mx-auto w-fit rounded-lg bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 hover:transition-colors disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50"
                      onClick={() =>
                        window.open(
                          `https://sepolia.etherscan.io/tx/${transaction.txHash}`,
                          "_blank",
                        )
                      }
                    >
                      {loading ? (
                        <div className="mx-auto h-6 w-6 animate-spin items-center justify-center rounded-full border-4 border-gray-300 border-l-white" />
                      ) : (
                        `View on Etherscan`
                      )}
                    </button>
                  ) : (
                    // ) : transaction.signature ? (
                    <button
                      className="mx-auto w-fit rounded-lg bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 hover:transition-colors disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50"
                      onClick={() =>
                        sendTransaction(transaction as TransactionWithWallet)
                      }
                    >
                      {loading ? (
                        <div className="mx-auto h-6 w-6 animate-spin items-center justify-center rounded-full border-4 border-gray-300 border-l-white" />
                      ) : (
                        `Execute Transaction`
                      )}
                    </button>
                  )
                  // ) :
                  //   <button
                  //     className="bg-blue-500 mx-auto hover:bg-blue-700 disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50 hover:transition-colors text-white font-bold py-2 w-fit px-4 rounded-lg"
                  //     onClick={() => signTransaction(transaction)}
                  //   >
                  //     {loading ? (
                  //       <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-l-white items-center justify-center mx-auto" />
                  //     ) : (
                  //       `Sign Transaction`
                  //     )}
                  //   </button>
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
