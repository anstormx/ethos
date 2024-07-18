import { prisma } from "@/utils/db";
import { isAddress } from "ethers/address";
import { NextRequest, NextResponse } from "next/server";
import { toast } from "react-toastify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, res: NextResponse) {
  try {
    const { searchParams } = new URL(req.url);

    // Get the wallet address from the query params
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      throw new Error("Missing or invalid address");
    }

    if (!isAddress(walletAddress)) {
      throw new Error("Invalid Ethereum address");
    }

    const wallet = await prisma.wallet.findFirst({
      where: {
        address: walletAddress,
      },
    });

    return NextResponse.json(wallet);
  } catch (error) {
    console.error(error);
    toast.error(`${error}`);
    return NextResponse.json({ error });
  }
}