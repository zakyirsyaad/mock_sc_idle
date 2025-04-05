import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying IdleToken with the account:", deployer.address);

  const IdleToken = await ethers.getContractFactory("IdleToken");
  const idleToken = await IdleToken.deploy(deployer.address);

  await idleToken.waitForDeployment();

  console.log("IdleToken deployed to:", await idleToken.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
