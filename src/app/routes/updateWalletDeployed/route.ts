import { prisma } from "@/utils/db";
import { NextRequest, NextResponse } from "next/server";
import { toast } from "react-toastify";

export async function POST(req: NextRequest) {
    try {
        const { walletId, transactionId, txHash } = await req.json();

        // Update the wallet's isDeployed status to true
        await prisma.wallet.update({
            where: {
                id: walletId,
            },
            data: {
                isDeployed: true,
            },
        });

        // Update the transaction with the txHash
        const res = await prisma.transaction.update({
            where: {
                id: transactionId,
            },
            data: {
                txHash,
            },
        });

        return NextResponse.json(res);
    } catch (error) {
        console.error(error);
        toast.error("An error occurred while updating wallet deployed status, check the console for more information");
        return NextResponse.json({ error });
    }
}