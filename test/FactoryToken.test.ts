import { expect } from "chai";
import { ethers } from "hardhat";
import { string } from "hardhat/internal/core/params/argumentTypes";

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

        // Deploy kontrak IDLE ERC20
        const IdleToken = await ethers.getContractFactory("ERC20Token");
        idleToken = await IdleToken.deploy("IDLE Token", "IDLE", initialSupply, owner.address);
        await idleToken.waitForDeployment(); // Ganti deployed() dengan waitForDeployment()

        // Transfer sebagian IDLE ke addr1
        await idleToken.transfer(addr1.address, ethers.parseUnits("1000", 18));

        // Deploy kontrak FactoryToken dengan alamat kontrak IDLE
        const FactoryToken = await ethers.getContractFactory("FactoryToken");
        factoryToken = await FactoryToken.deploy(idleToken.address);
        await factoryToken.waitForDeployment(); // Ganti deployed() dengan waitForDeployment()

        // Set approval untuk FactoryToken agar dapat mentransfer IDLE dari addr1
        await idleToken.connect(addr1).approve(factoryToken.address, ethers.parseUnits("1000", 18));
    });

    describe("createTokenWithPayment", function () {
        it("should create a new token with payment", async function () {
            const name = "MyToken";
            const ticker = "MTK";
            const iconURL = "https://example.com/icon.png";
            const description = "Deskripsi token";
            const socialMedia = "https://twitter.com/mytoken";
            const paymentAmount = ethers.parseUnits("10", 18); // 10 IDLE

            // Membuat token baru dengan pembayaran
            await expect(
                factoryToken.connect(addr1).createTokenWithPayment(
                    name,
                    ticker,
                    iconURL,
                    description,
                    socialMedia,
                    paymentAmount
                )
            )
                .to.emit(factoryToken, "TokenCreated")
                .withArgs(
                    addr1.address,
                    string, // Alamat token yang baru dibuat
                    name,
                    ticker,
                    ethers.parseUnits("1000000000", 18) // 1B total supply
                );

            // Verifikasi bahwa saldo IDLE addr1 berkurang sesuai dengan pembayaran
            const balanceAfter = await idleToken.balanceOf(addr1.address);
            expect(balanceAfter).to.equal(ethers.parseUnits("990", 18)); // 1000 - 10 IDLE
        });
    });

    describe("buyTokens", function () {
        it("should allow users to buy tokens with IDLE", async function () {
            // Membuat token baru dengan pembayaran
            const name = "MyToken";
            const ticker = "MTK";
            const iconURL = "https://example.com/icon.png";
            const description = "Deskripsi token";
            const socialMedia = "https://twitter.com/mytoken";
            const paymentAmount = ethers.parseUnits("10", 18); // 10 IDLE
            await factoryToken.connect(addr1).createTokenWithPayment(
                name,
                ticker,
                iconURL,
                description,
                socialMedia,
                paymentAmount
            );

            // Mendapatkan alamat token yang baru dibuat
            const tokens = await factoryToken.getAllTokens();
            const tokenAddress = tokens[0].tokenAddress;

            // Tentukan jumlah token yang ingin dibeli
            const amountToBuy = ethers.parseUnits("100", 18); // 100 token

            // Hitung biaya pembelian (misalnya 1 token = 10 IDLE)
            const cost = ethers.parseUnits("1000", 18); // 100 * 10 IDLE

            // Transfer IDLE dari addr1 ke kontrak FactoryToken
            await idleToken.connect(addr1).approve(factoryToken.address, cost);
            await factoryToken.connect(addr1).buyTokens(tokenAddress, amountToBuy);

            // Verifikasi saldo token addr1 bertambah sesuai jumlah yang dibeli
            const token = await ethers.getContractAt("ERC20Token", tokenAddress);
            const balance = await token.balanceOf(addr1.address);
            expect(balance).to.equal(amountToBuy);
        });
    });
});
