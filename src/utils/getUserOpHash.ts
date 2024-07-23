import { AbiCoder } from "ethers";
import { keccak256 } from "ethers";
import { UserOperationStruct } from "@/interface/types";
import { sepolia } from "wagmi/chains";
import { ENTRY_POINT_ADDRESS } from "./constants";

// Define an asynchronous function to get the user operation hash
export default async function getUserOpHash(userOp: UserOperationStruct) {
  // Encode all the userOp parameters except for the signatures
  const encodedUserOp = AbiCoder.defaultAbiCoder().encode(
    [
      "address",
      "uint256",
      "bytes32",
      "bytes32",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "bytes32",
    ],
    [
      userOp.sender,
      userOp.nonce,
      keccak256(userOp.initCode),
      keccak256(userOp.callData),
      userOp.callGasLimit,
      userOp.verificationGasLimit,
      userOp.preVerificationGas,
      userOp.maxFeePerGas,
      userOp.maxPriorityFeePerGas,
      keccak256(userOp.paymasterAndData),
    ],
  );

  // Encode the keccak256 hash with the address of the entry point contract and chainID to prevent replay attacks
  const encodedUserOpWithChainIdAndEntryPoint =
    AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "address", "uint256"],
      [keccak256(encodedUserOp), ENTRY_POINT_ADDRESS, sepolia.id],
    );

  // Return the keccak256 hash of the whole thing encoded
  return keccak256(encodedUserOpWithChainIdAndEntryPoint);
}
