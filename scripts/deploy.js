const { ethers } = require("hardhat");

async function main() {
    const Factory = await ethers.getContractFactory("WalletFactory");

    // Deploy the contract
    const factory = await Factory.deploy(
      "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
    );

    await factory.waitForDeployment();

    const deployedAddress = await factory.getAddress();

    console.log(`Factory deployed to: ${deployedAddress}`);
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
