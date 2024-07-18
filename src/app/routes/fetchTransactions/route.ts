import { prisma } from "@/utils/db";
import { isAddress } from "ethers/address";
import { NextRequest, NextResponse } from "next/server";
import { Transaction, Wallet } from "@prisma/client";
import { toast } from "react-toastify";

export const dynamic = "force-dynamic";

export type TransactionWithPendingSigner = Transaction ;

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
				wallet: true,
			},
			orderBy: {
				txHash: {
				sort: "asc",
				nulls: "first",
				},
			},
        });

        // Augment transactions with pendingSigner
        const augmentedTransactions: TransactionWithPendingSigner[] = transactions.map(
            (transaction) => ({
                ...transaction,
                pendingSigner: transaction.signerAddress !== transaction.wallet.signer,
            })
        );

        // Return the transactions in JSON format
        return NextResponse.json({ transactions: augmentedTransactions });
    } catch (error) {
        console.error(error);
		toast.error("Could not fetch transactions, check console for more details");
        return NextResponse.json({ error });
    }
}