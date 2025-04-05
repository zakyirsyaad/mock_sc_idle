import { ethers } from "hardhat";

async function main() {
  // Ambil akun pertama dari hardhat untuk digunakan sebagai deployer
  const IDLE_TOKEN_SEPOLIA = "0xbE2097440Fb3bCbbF529b53DaC993B6F22CB09f6";
  const IDLE_TOKEN_SONIC = "0x1CA16cb7E040b4a2c1BA7B44bc508776e348EF9d";
  const IDLE_TOKEN_EDUCHAINTESTNET =
    "0x1CA16cb7E040b4a2c1BA7B44bc508776e348EF9d";

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with the account:", deployer.address);

  // Deploy SwapToken contract
  const SwapToken = await ethers.getContractFactory("Swap");
  const swapToken = await SwapToken.deploy(IDLE_TOKEN_EDUCHAINTESTNET);
  await swapToken.waitForDeployment();

  console.log("SwapToken deployed to:", await swapToken.getAddress());
}

// Jalankan deploy script dengan `npx hardhat run scripts/deploy.js --network localhost`
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
