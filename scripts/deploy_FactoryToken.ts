import { ethers } from "hardhat";

async function main() {
  // Define the address of the IDLE token contract
  // const IDLE_TOKEN_ADDRESS = "0xdBFFbFE94E21Ab4ff2397f4425511f6e1908625D"; // Ganti dengan alamat yang sudah dideploy
  // const IDLE_TOKEN_SONIC = "0x1CA16cb7E040b4a2c1BA7B44bc508776e348EF9d";
  const IDLE_TOKEN_SEPOLIA = "0xbE2097440Fb3bCbbF529b53DaC993B6F22CB09f6";
  const IDLE_TOKEN_EDUCHAINTESTNET =
    "0x1CA16cb7E040b4a2c1BA7B44bc508776e348EF9d";
  // Replace with actual address
  const [deployer] = await ethers.getSigners();
  console.log(
    `Deploying Factory Token contract with account: ${deployer.address}`
  );

  // Deploy the FactoryToken contract
  const FactoryToken = await ethers.getContractFactory("FactoryToken");
  const factoryToken = await FactoryToken.deploy(IDLE_TOKEN_EDUCHAINTESTNET);
  await factoryToken.waitForDeployment();

  console.log(`Factory Token contract deployed at: ${factoryToken.target}`);
}

// Execute the deployment script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
