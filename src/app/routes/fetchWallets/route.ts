import { prisma } from "@/utils/db";
import { isAddress } from "ethers/address";
import { NextRequest, NextResponse } from "next/server";
import { toast } from "react-toastify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      throw new Error("Missing or invalid address");
    }

    if (!isAddress(address)) {
      throw new Error("Invalid Ethereum address");
    }

    const wallets = await prisma.wallet.findMany({
      where: {
        signer: address.toLowerCase(),
      },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    return NextResponse.json(wallets);
  } catch (error) {
    console.error(error);
    toast.error(
      "An error occurred while fetching wallets, check the console for more information",
    );
    return NextResponse.json({ error });
  }
}
