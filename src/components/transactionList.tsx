import { TransactionWithPendingSigner } from "@/app/routes/fetchTransactions/route";
import { BUNDLER_RPC_URL, WALLET_FACTORY_ADDRESS } from "@/utils/constants";
import { getUserOperationBuilder } from "@/utils/getUserOpForETHTransfer";
import getUserOpHash from "@/utils/getUserOpHash";
import { useEffect, useState, useCallback } from "react";
import { V06 } from "userop";
import { ENTRY_POINT_ADDRESS } from "@/utils/constants";
import { entryPointContract, provider } from "@/utils/getContracts";
import { UserOperationStruct, Hex } from "@/interface/types";
import { useWalletClient } from "wagmi";
import Icon from "./icon";
import { useIsMounted } from "@/hooks/useIsMounted";
import { Bundler } from "@biconomy/account";
import axios from "axios";
import { createGasEstimator } from "entry-point-gas-estimations";
import { UserOperation } from "entry-point-gas-estimations";
import { EstimateUserOperationGas } from "entry-point-gas-estimations";
import { toast } from "react-toastify";
import { Prisma } from "@prisma/client";

type TransactionWithWallet = Prisma.TransactionGetPayload<{
  include: { wallet: true }
}>;

require("dotenv").config();

const BICONOMY_API_KEY = process.env.NEXT_PUBLIC_BICONOMY_API_KEY as string;

interface TransactionListProps {
  address: string;
  walletAddress: string;
}

function biginttostring (userOpFinal: UserOperationStruct) {
  return Object.fromEntries(
    Object.entries(userOpFinal).map(([key, value]) => [
        key,
        typeof value === 'bigint' ? value.toString() : value
    ])
  ) as UserOperationStruct;
}

export default function TransactionsList({ address, walletAddress}: TransactionListProps) {
  const isMounted = useIsMounted();

  const [walletTxns, setWalletTxns] = useState<TransactionWithPendingSigner[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: walletClient } = useWalletClient();

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch(
        `/routes/fetchTransactions?walletAddress=${walletAddress}`
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setWalletTxns(data.transactions);

    } catch (error) {
      console.error(error);
      toast.error("An error occurred while fetching transactions, check the console for more information");
    }
  }, [walletAddress]);

  const signTransaction = async (transaction: TransactionWithPendingSigner) => {
    // If there's no wallet client, return immediately
    if (!walletClient) return;

    try {
      setLoading(true);
  
      const userOpHash = await getUserOpHash(
        transaction.userOp as unknown as UserOperationStruct
      );
  
      // Request the wallet client to sign the message with the user operation hash
      const signature = await walletClient.signMessage({
        message: { raw: userOpHash as Hex },
      });

      console.log("signature", signature);
  
      // Send a POST request to the create-signature endpoint with the signer's address, signature, and transaction ID
      const response = await fetch("/routes/createSignature", {
        method: "POST",
        body: JSON.stringify({
        signerAddress: address,
        signature,
        transactionId: transaction.id,
        }),
      });
  
      // Parse the response data
      const data = await response.json();
    
      if (data.error) throw new Error(data.error);
    
      toast.success("Transaction signed successfully");   

      window.location.reload();

    } catch (e) {
      console.error(e);
      toast.error("An error occurred while signing the transaction, check the console for more information");
      setLoading(false);
    }
  };

  const sendTransaction = async (transaction: TransactionWithWallet) => {
    try {
      setLoading(true);
  
      // Get the user operation from the transaction
      const userOp = transaction.userOp as unknown as UserOperationStruct;
  
      // Initialize the bundler's client
      const bundler = await Bundler.create({
          chainId: 11155111,
          bundlerUrl: BICONOMY_API_KEY,
          entryPointAddress: ENTRY_POINT_ADDRESS,
      });
  
      let initCode = userOp.initCode as Hex;
  
      // If the wallet is already deployed, set the initCode to an empty array
      if (transaction.wallet.isDeployed) {
        initCode = `0x`;
      }

      const {maxFeePerGas, maxPriorityFeePerGas} = await provider.getFeeData();
  
      // Get the user operation builder
      const userOpFinal = getUserOperationBuilder(
        userOp.sender,
        userOp.nonce,
        initCode,
        userOp.callData,
        userOp.callGasLimit,
        maxFeePerGas as bigint,
        maxPriorityFeePerGas as bigint,
        transaction.signature as Hex,
      );

      const userOpConverted = biginttostring(userOpFinal);

      console.log(userOpConverted);

      // // Send the user operation and wait for the result
      // const userOpHash = await V06.Bundler.SendUserOperationWithEthClient(
      //   userOpConverted as UserOperation,
      //   ENTRY_POINT_ADDRESS,
      //   provider, 
      // );

      // // Get the transaction receipt            
      // const txHashReciept = await V06.Bundler.GetUserOperationReceiptWithEthClient(
      //   userOpHash,
      //   provider,
      // );

      // console.log("txHashReciept", txHashReciept);  

      // const gas = await bundler.estimateUserOpGas(userOpConverted as UserOperationStruct);
      // console.log("gas", gas);

      // toast.success("Feature coming soon, check the console for userop details");
      // setLoading(false);
      // return;



      // // const userOpGasResponse = await getUserOpGasLimits(userOpFinal);
      // const userOpGasResponse = await bundler.estimateUserOpGas(userOpConverted as UserOperationStruct);
      const gasEstimator = createGasEstimator({
        rpcUrl: 'https://sepolia.infura.io/v3/e8aee5a01fcc4f82bb9b3437eae91d8f',
        entryPointAddress: ENTRY_POINT_ADDRESS
      });

      const estimateUserOperationGasResponse: EstimateUserOperationGas = await gasEstimator.estimateUserOperationGas({
        userOperation: userOpFinal as UserOperation,
      });

      console.log(estimateUserOperationGasResponse);


  
      // const txn = await bundler.sendUserOp(userOpConverted, "validation");

      // console.log(txn);

      // const txnreceipt = await bundler.getUserOpReceipt(txn.userOpHash);

  
      // // Get the transaction hash 
      // const txHash = txnreceipt?.receipt;

      // console.log("tx",txHash);
  
      // Mark the wallet as deployed by sending a POST request to the update-wallet-deployed endpoint
      // await fetch("/routes/updateWalletDeployed", {
      //     method: "POST",
      //     body: JSON.stringify({
      //     walletId: transaction.wallet.id,
      //     transactionId: transaction.id,
      //     txHash,
      //     }),
      // });
  
      // Alert the user that the transaction was sent successfully
      toast.success("Transaction sent successfully");

      // Reload the page to reflect the new state
      window.location.reload();
    } catch (e) {
      console.log(e);
      toast.error("An error occurred while sending the transaction, check the console for more information");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, address]); 

  if (!isMounted) return null;

  return (
    <main className="flex flex-col justify-center p-10 items-center  gap-5">
      <h1 className="text-5xl font-bold">Transactions</h1>

      {walletTxns.length === 0 ? 
        <div className="flex justify-center items-center border-2 border-dashed p-6 rounded-lg">
          <p className="text-lg">You currently have no transactions.</p>
        </div>
      : 
        <div className="grid grid-cols-3 gap-4">
          {walletTxns.map((transaction) => (
            <div
              key={transaction.id}
              className="flex flex-col border border-gray-800 rounded-lg gap-2 p-2"
            >
              <span className="bg-gray-800 w-full text-center">
                Transaction #{transaction.id}
              </span>
              <div className="flex flex-col gap-2">
                  <div
                    key={transaction.signature}
                    className="flex font-mono gap-4"
                  >
                    <span>{transaction.signerAddress}</span>
                    <Icon type="check" />
                  </div>

                {transaction.txHash ? (
                  <button
                    className="bg-blue-500 mx-auto hover:bg-blue-700 disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50 hover:transition-colors text-white font-bold py-2 w-fit px-4 rounded-lg"
                    onClick={() =>
                      window.open(
                        `https://sepolia.etherscan.io/tx/${transaction.txHash}`,
                        "_blank"
                      )
                    }
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-l-white items-center justify-center mx-auto" />
                    ) : (
                      `View on Etherscan`
                    )}
                  </button>
                ) : transaction.signature ? (
                  <button
                    className="bg-blue-500 mx-auto hover:bg-blue-700 disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50 hover:transition-colors text-white font-bold py-2 w-fit px-4 rounded-lg"
                    onClick={() => sendTransaction(transaction as TransactionWithWallet)}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-l-white items-center justify-center mx-auto" />
                    ) : (
                      `Execute Transaction`
                    )}
                  </button>
                ) : 
                  <button
                    className="bg-blue-500 mx-auto hover:bg-blue-700 disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50 hover:transition-colors text-white font-bold py-2 w-fit px-4 rounded-lg"
                    onClick={() => signTransaction(transaction)}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-l-white items-center justify-center mx-auto" />
                    ) : (
                      `Sign Transaction`
                    )}
                  </button>
                }
              </div>
            </div>
          ))}
        </div>
      }
    </main>
  );
}