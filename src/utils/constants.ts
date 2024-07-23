import walletFactory from "./WalletFactory.json";
import wallet from "./Wallet.json";
import entrypointabi from "./EntryPoint.json";

export const WALLET_FACTORY_ADDRESS = "0x2ca5d823419764c8Cb67d0B9c6B9d0D34F14257b";

export const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

export const BUNDLER_RPC_URL = `https://api.stackup.sh/v1/node/${process.env.NEXT_PUBLIC_STACKUP_API_KEY}`;
// export const BUNDLER_RPC_URL = `${process.env.NEXT_PUBLIC_SEPOLIA_RPC}`;


export const ENTRY_POINT_ABI = entrypointabi;

export const WALLET_FACTORY_ABI = walletFactory.abi;

export const WALLET_ABI = wallet.abi;