// FactoryToken.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { any } from "hardhat/internal/core/params/argumentTypes";

describe("FactoryToken", function () {
    let owner: any;
    let addr1: any;
    let addr2: any;
    let idleToken: any;
    let factoryToken: any;
    let initialSupply = ethers.parseUnits("1000000", 18); // 1 juta IDLE

    beforeEach(async function () {
        // Mendapatkan akun-akun yang tersedia
        [owner, addr1, addr2] = await ethers.getSigners();
        console.log("Owner:", owner.address);
        console.log("Addr1:", addr1.address);
        console.log("Addr2:", addr2.address);

        // Deploy kontrak IDLE ERC20
        const IdleToken = await ethers.getContractFactory("ERC20Token");
        idleToken = await IdleToken.deploy("IDLE Token", "IDLE", initialSupply, owner.address);
        await idleToken.waitForDeployment(); // Ganti deployed() dengan waitForDeployment()
        console.log("IdleToken deployed at:", idleToken.target);

        // Transfer sebagian IDLE ke addr1
        await idleToken.transfer(addr1.address, ethers.parseUnits("10000", 18)); // Increase the transfer amount

        // Deploy kontrak FactoryToken dengan alamat kontrak IDLE
        const FactoryToken = await ethers.getContractFactory("FactoryToken");
        factoryToken = await FactoryToken.deploy(idleToken.target); // Use idleToken.target instead of idleToken.address
        await factoryToken.waitForDeployment(); // Ganti deployed() dengan waitForDeployment()
        console.log("FactoryToken deployed at:", factoryToken.target);

        // Set approval untuk FactoryToken agar dapat mentransfer IDLE dari addr1
        await idleToken.connect(addr1).approve(factoryToken.target, ethers.parseUnits("10000", 18));
    });

    describe("createTokenWithPayment", function () {
        it("should create a new token with payment", async function () {
            const name = "MyToken";
            const ticker = "MTK";
            const iconURL = "https://example.com/icon.png";
            const description = "Deskripsi token";
            const socialMedia = "https://twitter.com/mytoken";
            const paymentAmount = ethers.parseUnits("10", 18); // 10 IDLE

            // Listen for the TokenCreated event
            const tx = await factoryToken.connect(addr1).createTokenWithPayment(
                name,
                ticker,
                iconURL,
                description,
                socialMedia,
                paymentAmount
            );
            const receipt = await tx.wait();

            // Debugging: Print the transaction receipt
            console.log("Transaction Receipt:", receipt);

            // Parse event using contract interface
            const factoryTokenInterface = factoryToken.interface;
            const event = factoryTokenInterface.parseLog(
                receipt.logs.find((log: any) =>
                    log.address === factoryToken.target &&
                    log.topics[0] === factoryTokenInterface.getEvent("TokenCreated").topicHash
                )
            );

            if (!event) {
                throw new Error("TokenCreated event not found");
            }

            const [creator, tokenAddress, emittedName, emittedTicker, emittedSupply] = event.args;

            // Verify the event arguments
            expect(creator).to.equal(addr1.address);
            expect(tokenAddress).to.be.a('string'); // Ensure tokenAddress is a string
            expect(emittedName).to.equal(name);
            expect(emittedTicker).to.equal(ticker);
            expect(emittedSupply).to.equal(ethers.parseUnits("1000000000", 18)); // 1B total supply

            // Verifikasi bahwa saldo IDLE addr1 berkurang sesuai dengan pembayaran
            const balanceAfter = await idleToken.balanceOf(addr1.address);
            expect(balanceAfter).to.equal(ethers.parseUnits("9990", 18)); // 10000 - 10 IDLE

            // Verifikasi fee 10% dikirim ke wallet khusus
            const feeWalletBalance = await idleToken.balanceOf("0xB53F9688e99D34EF93392F88fD01d6E5651d8CfA");
            expect(feeWalletBalance).to.equal(ethers.parseUnits("1", 18)); // 10% dari 10 IDLE

            // Verifikasi sisa 9 IDLE di factory contract
            const factoryBalance = await idleToken.balanceOf(factoryToken.target);
            expect(factoryBalance).to.equal(ethers.parseUnits("9", 18));
        });
    });

    describe("buyTokens", function () {
        it("should allow users to buy tokens with IDLE", async function () {
            // Adjust payment amount to account for both creation and purchase
            const paymentAmount = ethers.parseUnits("0", 18); // Change from 10 to 0 IDLE

            // Create token with zero payment
            await factoryToken.connect(addr1).createTokenWithPayment(
                "MyToken",
                "MTK",
                "https://example.com/icon.png",
                "Deskripsi token",
                "https://twitter.com/mytoken",
                paymentAmount
            );

            // Mendapatkan alamat token yang baru dibuat
            const tokens = await factoryToken.getAllTokens();
            const tokenAddress = tokens[0].tokenAddress;
            console.log("New token deployed at:", tokenAddress);

            // Tentukan jumlah token yang ingin dibeli
            const amountToBuy = ethers.parseUnits("100", 18); // 100 token

            // Hitung biaya pembelian yang benar (1 token = 10 IDLE)
            const cost = ethers.parseUnits("1000", 18); // 100 token * 10 IDLE

            // Verifikasi saldo IDLE addr1 sebelum pembelian
            const idleBalanceBefore = await idleToken.balanceOf(addr1.address);
            console.log("Idle balance before:", ethers.formatUnits(idleBalanceBefore, 18));

            // Pastikan saldo IDLE addr1 cukup untuk pembelian
            expect(idleBalanceBefore).to.be.at.least(cost);

            // Update approval untuk jumlah yang diperlukan
            await idleToken.connect(addr1).approve(factoryToken.target, cost);

            // Beli token
            await factoryToken.connect(addr1).buyTokens(tokenAddress, amountToBuy);

            // Verifikasi saldo token addr1 bertambah sesuai jumlah yang dibeli
            const token = await ethers.getContractAt("ERC20Token", tokenAddress);
            const balance = await token.balanceOf(addr1.address);
            expect(balance).to.equal(amountToBuy);

            // Verifikasi saldo IDLE addr1 berkurang sesuai dengan pembayaran
            const idleBalanceAfter = await idleToken.balanceOf(addr1.address);
            console.log("Idle balance after:", ethers.formatUnits(idleBalanceAfter, 18));
            expect(idleBalanceBefore - cost).to.equal(idleBalanceAfter);
        });
    });
});