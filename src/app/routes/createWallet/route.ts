import { prisma } from "@/utils/db";
import { walletFactoryContract } from "@/utils/getContracts";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { toast } from "react-toastify";


export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const { signer }: { signer: string } = await req.json();

    console.log(signer);

    // Generate a random salt, convert it to hexadecimal, and prepend "0x"
    const salt = "0x" + randomBytes(32).toString("hex");

    // Call the getAddress function from the wallet factory contract with the signers and salt
    // This computes the counterfactual address for the wallet without deploying it
    const walletAddress = await walletFactoryContract.getProxyAddress(signer, salt);

    const response = await prisma.wallet.create({
      data: {
        salt: salt,
        signer: signer.toLowerCase(), // Convert all signer addresses to lowercase for consistency
        isDeployed: false,
        address: walletAddress,
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    toast.error("An error occurred while creating wallet, check the console for more information");
    console.error(error);
    return NextResponse.json({ error });
  }
}