import { ENTRY_POINT_ADDRESS, WALLET_FACTORY_ADDRESS } from "@/utils/constants";
import {
  entryPointContract,
  getWalletContract,
  provider,
  walletFactoryContract,
} from "@/utils/getContracts";
import { concat, ethers, keccak256, N } from "ethers";
import { Hex, UserOperationStruct } from "@/interface/types";
import { AbiCoder } from "ethers";
import { toast } from "react-toastify";
import { createBundler } from "@biconomy/account";

export const getUserOperationBuilder = async (
  walletAddress: Hex,
  nonce: bigint,
  initCode: Hex,
  encodedCallData: Hex,
  // callGasLimit: bigint,
  verificationGasLimit: bigint,
  maxFeePerGas: bigint,
  maxPriorityFeePerGas: bigint,
  preVerificationGasSent?: bigint,
  signature?: Hex,
): Promise<UserOperationStruct> => {
  try {
    let encodedSignatures = "0x";
    return {
      sender: walletAddress,
      nonce,
      initCode,
      callData: encodedCallData,
      callGasLimit: 0n,
      verificationGasLimit,
      preVerificationGas: 70000n,
      maxFeePerGas,
      maxPriorityFeePerGas,
      paymasterAndData: "0x",
      signature: encodedSignatures as Hex,
    };
  } catch (e) {
    console.log(e);
    throw e;
  }
};

export async function getUserOpForETHTransfer(
  walletAddress: Hex,
  owner: string,
  salt: string,
  toAddress: string,
  value: bigint,
  isDeployed?: boolean,
) {
  try {
    let initCode = "0x" as Hex;
    let initCodeGas = BigInt(0);
    if (!isDeployed) {
      // Encode the function data for creating a new account
      const data = walletFactoryContract.interface.encodeFunctionData(
        "createAccount",
        [owner, salt],
      );

      initCode = concat([WALLET_FACTORY_ADDRESS, data]) as Hex;

      const initAddr = ethers.dataSlice(initCode!, 0, 20);

      initCodeGas = await provider.estimateGas({
        from: ENTRY_POINT_ADDRESS,
        to: initAddr,
        data: data,
        gasLimit: 10e6,
      });
    }

    console.log("Init Code Gas: ", initCodeGas);
    console.log("Init Code: ", initCode);

    // Get the nonce for the wallet address with a key of 0
    const nonce = await entryPointContract.getNonce(walletAddress, 0);

    console.log("Nonce: ", nonce);

    // Get the wallet contract instance
    const walletContract = getWalletContract(walletAddress);

    // Encode the call data for the execute method
    const encodedCallData = walletContract.interface.encodeFunctionData(
      "execute",
      [toAddress, value, initCode],
    ) as Hex;

    const verificationGasLimit = 150000n + BigInt(initCodeGas);

    console.log("Init Code Gas: ", initCodeGas);
    console.log("Verification Gas Limit: ", verificationGasLimit);

    // Get the user operation builder with the necessary parameters
    const userOp = await getUserOperationBuilder(
      walletAddress,
      nonce,
      initCode as Hex,
      encodedCallData,
      // callGasLimit,
      verificationGasLimit,
      BigInt(0),
      BigInt(0),
    );

    console.log("User Operation: ", userOp);

    return userOp;
  } catch (e) {
    toast.error(
      "Error in getUserOpForETHTransfer, check console for more details",
    );
    console.log(e);
  }
}
