import { expect } from "chai";
import { ethers } from "hardhat";

describe("Swap", function () {
    let Swap: any, swap: any, IdleToken: any, idleToken: any, owner: any, addr1: any, addr2: any;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy Token IDLE
        IdleToken = await ethers.getContractFactory("IdleToken");
        idleToken = await IdleToken.deploy(owner.address);
        await idleToken.waitForDeployment();

        // Deploy Swap
        Swap = await ethers.getContractFactory("Swap");
        swap = await Swap.deploy(idleToken.target);
        await swap.waitForDeployment();

        // Mint dan Approve Token IDLE ke addr1
        await idleToken.mint(addr1.address, ethers.parseEther("1000"));
        await idleToken.connect(addr1).approve(swap.target, ethers.parseEther("1000"));

        // Tambahkan lebih banyak likuiditas dari owner
        await idleToken.approve(swap.target, ethers.parseEther("500"));
        await swap.addLiquidity(ethers.parseEther("500"), { value: ethers.parseEther("10") }); // Ubah jadi 10 ETH
    });

    it("should swap Token to ETH", async function () {
        // Cek ETH sebelum swap
        const ethBefore = await ethers.provider.getBalance(swap.target);
        console.log("ETH sebelum swap:", ethers.formatEther(ethBefore));

        // Cek jumlah ETH yang akan didapat
        const amountOut = await swap.calculateSwap(ethers.parseEther("1"), false);
        console.log("ETH yang akan diberikan:", ethers.formatEther(amountOut));

        // Pastikan addr1 punya cukup token untuk swap
        await swap.connect(addr1).swapTokenToEth(ethers.parseEther("100"));

        const ethAfter = await ethers.provider.getBalance(swap.target);
        console.log("ETH setelah swap:", ethers.formatEther(ethAfter));

        // Addr1 harus menerima ETH
        const ethBalance = await ethers.provider.getBalance(addr1.address);
        expect(ethBalance).to.be.gt(ethers.parseEther("0.9"));
    });
});
