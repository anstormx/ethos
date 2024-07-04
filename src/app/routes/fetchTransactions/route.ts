import { prisma } from "@/utils/db";
import { isAddress } from "ethers/address";
import { NextRequest, NextResponse } from "next/server";
import { Transaction, TransactionSignature, Wallet } from "@prisma/client";
import { toast } from "react-toastify";

export const dynamic = "force-dynamic";

export type TransactionWithSignatures = Transaction & {
    signatures: TransactionSignature[];
    wallet: Wallet;
    pendingSigners: string[];
};

export async function GET(req: NextRequest, res: NextResponse) {
    try {
        const { searchParams } = new URL(req.url);
        const walletAddress = searchParams.get("walletAddress");

        if (!walletAddress) {
        	throw new Error("Missing or invalid wallet address");
        }

        if (!isAddress(walletAddress)) {
        	throw new Error("Invalid Ethereum address");
        }

        // Fetch all transactions associated with the walletAddress
        const transactions = await prisma.transaction.findMany({
			where: {
				wallet: {
				address: walletAddress,
				},
			},
			include: {
				signatures: true,
				wallet: true,
			},
			orderBy: {
				txHash: {
				sort: "asc",
				nulls: "first",
				},
			},
        });

        // Augment transactions with pendingSigners
        const augmentedTransactions: TransactionWithSignatures[] = transactions.map(
			(transaction) => {
				// Filter out signers who haven't completed a signature
				const pendingSigners = transaction.wallet.signers.filter(
				(signer) =>
					!transaction.signatures.find(
					(signature) => signature.signerAddress === signer
					)
				);

				// Return the transaction with pendingSigners
				return {...transaction, pendingSigners};
			}
        );

        // Return the transactions in JSON format
        return NextResponse.json({ transactions: augmentedTransactions });
    } catch (error) {
        console.error(error);
		toast.error("Could not fetch transactions, check console for more details");
        return NextResponse.json({ error });
    }
}