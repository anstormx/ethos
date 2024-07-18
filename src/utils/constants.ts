import walletFactory from "../../contracts/out/WalletFactory.sol/WalletFactory.json";
import wallet from "../../contracts/out/Wallet.sol/Wallet.json";

export const WALLET_FACTORY_ADDRESS = "0x013ad1406a32279dfaa80d2c80c9e7e55c08795a";

export const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

export const BUNDLER_RPC_URL = `https://api.stackup.sh/v1/node/${process.env.NEXT_PUBLIC_STACKUP_API_KEY}`;


export const ENTRY_POINT_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "uint192",
        name: "key",
        type: "uint192",
      },
    ],
    name: "getNonce",
    outputs: [
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const

export const WALLET_FACTORY_ABI = walletFactory.abi;

export const WALLET_ABI = wallet.abi;