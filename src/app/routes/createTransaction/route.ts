import { prisma } from "@/utils/db";
import { isAddress } from "ethers/address";
import { NextRequest, NextResponse } from "next/server";
import { toast } from "react-toastify";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, userOp, signerAddress, signature } =
      await req.json();

    if (!isAddress(walletAddress)) throw new Error("Invalid walletAddress");

    await prisma.transaction.create({
      data: {
        wallet: {
          connect: {
            address: walletAddress,
          },
        },
        userOp,
        signature,
        signerAddress: signerAddress.toLowerCase(), //remove
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    toast.error("An error occurred while creating transaction, check the console for more information");
    return NextResponse.json({ error });
  }
}