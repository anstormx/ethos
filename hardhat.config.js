require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: `${process.env.NEXT_PUBLIC_SEPOLIA_RPC}`,
      accounts: [`${process.env.ACCOUNT_PRIVATE_KEY}`],
    },
  },
};
