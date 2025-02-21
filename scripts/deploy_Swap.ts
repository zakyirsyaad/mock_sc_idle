import { ethers } from "hardhat";

async function main() {
    const IDLE_TOKEN_ADDRESS = "0xdBFFbFE94E21Ab4ff2397f4425511f6e1908625D"; // Ganti dengan alamat yang sudah dideploy

    const [deployer] = await ethers.getSigners();
    console.log(`Deploying Swap contract with account: ${deployer.address}`);

    // Deploy Swap Contract
    const Swap = await ethers.getContractFactory("Swap");
    const swap = await Swap.deploy(IDLE_TOKEN_ADDRESS);
    await swap.waitForDeployment();

    console.log(`Swap contract deployed at: ${swap.target}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
