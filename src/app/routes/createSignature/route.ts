import { prisma } from "@/utils/db";
import { NextRequest, NextResponse } from "next/server";
import { toast } from "react-toastify";


export async function POST(req: NextRequest) {
    try {
        const { signature, signerAddress, transactionId } = await req.json();

        await prisma.transaction.update({
        where: {
            id: transactionId,
        },
        data: {
            signature,
            signerAddress: signerAddress.toLowerCase(),
        },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        toast.error("An error occurred while signing transaction, check the console for more information");
        return NextResponse.json({ error });
    }
}