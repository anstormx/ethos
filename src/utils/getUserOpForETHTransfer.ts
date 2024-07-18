import {
  WALLET_FACTORY_ADDRESS
} from "@/utils/constants";
import {
  entryPointContract,
  getWalletContract,
  provider,
  walletFactoryContract,
} from "@/utils/getContracts";
import {
  concat
} from "ethers";
import {
  Hex,
  UserOperationStruct
} from "@/interface/types";
import {
  AbiCoder
} from "ethers";
import { toast } from "react-toastify";

export function getUserOperationBuilder(
  walletContract: Hex,
  nonce: bigint,
  initCode: Hex,
  encodedCallData: Hex,
  callGasLimit: bigint,
  maxFeePerGas: bigint,
  maxPriorityFeePerGas: bigint,
  signature ? : Hex,
): UserOperationStruct {
  try {
    let encodedSignatures = "0x";
    if (signature) {
      encodedSignatures = AbiCoder.defaultAbiCoder().encode(["bytes"], [signature]) as Hex;
      console.log(encodedSignatures);
    }

    return {
      sender: walletContract,
      nonce,
      initCode,
      callData: encodedCallData,
      callGasLimit,
      verificationGasLimit: BigInt(2000000),
      preVerificationGas: BigInt(100000),
      maxFeePerGas,
      maxPriorityFeePerGas,
      paymasterAndData: "0x",
      signature: encodedSignatures as Hex,
    };
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function getUserOpForETHTransfer(
  walletAddress: Hex,
  owner: string,
  salt: string,
  toAddress: string,
  value: bigint,
  isDeployed ? : boolean
) {
  try {
    let initCode = "0x" as Hex;
    if (!isDeployed) {
      // Encode the function data for creating a new account
      const data = walletFactoryContract.interface.encodeFunctionData(
        "createAccount",
        [owner, salt]
      );

      // Initialize the initCode which will be used to deploy a new wallet
      initCode = concat([WALLET_FACTORY_ADDRESS, data]) as Hex;
    }

    // Get the nonce for the wallet address with a key of 0
    const nonce: bigint = await entryPointContract.getNonce(
      walletAddress,
      0
    );

    // Get the wallet contract instance
    const walletContract = getWalletContract(walletAddress);

    // Encode the call data for the execute method
    const encodedCallData = walletContract.interface.encodeFunctionData(
      "execute",
      [toAddress, value, initCode]
    ) as Hex;

    // Estimate the gas limit for the call data
    const callDataGasLimit = await provider.estimateGas({
      from: process.env.ENTRY_POINT_ADDRESS,
      to: walletAddress,
      data: encodedCallData,
    });

    console.log("Call Data Gas Limit: ", callDataGasLimit);

    // Get the current gas prices
    const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = await provider.getFeeData();

    // Get the user operation builder with the necessary parameters
    const userOp = getUserOperationBuilder(
      walletAddress,
      nonce,
      initCode as Hex,
      encodedCallData,
      callDataGasLimit,
      BigInt(maxFeePerGas as bigint),
      BigInt(maxPriorityFeePerGas as bigint),
    );

    console.log("User Operation: ", userOp);
    
    return userOp;

  } catch (e) {
    toast.error("Error in getUserOpForETHTransfer, check console for more details");
    console.log(e);
  }
}