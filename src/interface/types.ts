export interface UserOperationStruct {
  sender: Hex;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: Hex;
  signature: BytesLike;
}

export type BytesLike = Uint8Array | Hex;

export type Hex = `0x${string}`;
