import { ethers } from "hardhat";

async function main() {
  const TOKEN1_ADDRESS = "0x61876F0429726D7777B46f663e1C9ab75d08Fc56";
  const TOKEN2_ADDRESS = "0x1CA16cb7E040b4a2c1BA7B44bc508776e348EF9d";

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying TokenSwap contract with account: ${deployer.address}`);

  // Deploy TokenSwap Contract without arguments
  const TokenSwap = await ethers.getContractFactory("TokenSwap");
  const swap = await TokenSwap.deploy();
  await swap.waitForDeployment();

  const swapAddress = await swap.getAddress();
  console.log(`TokenSwap contract deployed at: ${swapAddress}`);

  // Now add the token pair
  const RATE = ethers.parseEther("2"); // Setting 2 tokens with 18 decimals
  console.log("Adding token pair...");
  const tx = await swap.addPair(TOKEN1_ADDRESS, TOKEN2_ADDRESS, RATE);
  await tx.wait();
  console.log("Token pair added successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
