import { Contract, JsonRpcProvider } from "ethers";
import {
  BUNDLER_RPC_URL,
  ENTRY_POINT_ADDRESS,
  ENTRY_POINT_ABI,
  WALLET_ABI,
  WALLET_FACTORY_ABI,
  WALLET_FACTORY_ADDRESS,
} from "./constants";

export const provider = new JsonRpcProvider(BUNDLER_RPC_URL);

export const entryPointContract = new Contract(
  ENTRY_POINT_ADDRESS,
  ENTRY_POINT_ABI,
  provider,
);

export const walletFactoryContract = new Contract(
  WALLET_FACTORY_ADDRESS,
  WALLET_FACTORY_ABI,
  provider,
);

export const getWalletContract = (walletAddress: string) => {
  return new Contract(walletAddress, WALLET_ABI, provider);
};
