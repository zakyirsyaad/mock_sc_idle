import { ethers } from "hardhat";

async function main() {
    // Define the address of the IDLE token contract
    const IDLE_TOKEN_ADDRESS = "0xdBFFbFE94E21Ab4ff2397f4425511f6e1908625D"; // Ganti dengan alamat yang sudah dideploy
    // Replace with actual address
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying Swap contract with account: ${deployer.address}`);

    // Deploy the FactoryToken contract
    const FactoryToken = await ethers.getContractFactory("FactoryToken");
    const factoryToken = await FactoryToken.deploy(IDLE_TOKEN_ADDRESS);
    await factoryToken.waitForDeployment()

    console.log(`Swap contract deployed at: ${factoryToken.target}`);
}

// Execute the deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
