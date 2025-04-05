import { expect } from "chai";
import { ethers } from "hardhat";

describe("SwapToken", function () {
  let SwapToken, swapToken, owner, addr1, addr2, testToken;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy test ERC20 token
    const TestToken = await ethers.getContractFactory("TestToken");
    testToken = await TestToken.deploy("Test Token", "TTK", 1000000);
    await testToken.waitForDeployment();

    // Deploy SwapToken contract
    SwapToken = await ethers.getContractFactory("SwapToken");
    swapToken = await SwapToken.deploy();
    await swapToken.waitForDeployment();

    // Approve SwapToken contract to spend addr1's tokens
    const token = await ethers.getContractAt(
      "TestToken",
      await testToken.getAddress()
    );
    await token.transfer(addr1.address, 10000);
    await token.approve(await swapToken.getAddress(), 5000);
  });

  it("Should deploy with correct initial state", async function () {
    expect(
      await ethers.provider.getBalance(await swapToken.getAddress())
    ).to.equal(0);
  });

  it("Should allow adding ETH liquidity", async function () {
    await swapToken
      .connect(addr1)
      .addLiquidity(ethers.ZeroAddress, 0, { value: ethers.parseEther("1") });
    expect(
      await ethers.provider.getBalance(await swapToken.getAddress())
    ).to.equal(ethers.parseEther("1"));
  });

  it("Should allow adding ERC20 token liquidity", async function () {
    await swapToken
      .connect(addr1)
      .addLiquidity(await testToken.getAddress(), 5000);
    expect(await testToken.balanceOf(await swapToken.getAddress())).to.equal(
      5000
    );
  });

  it("Should allow removing liquidity", async function () {
    await swapToken
      .connect(addr1)
      .addLiquidity(ethers.ZeroAddress, 0, { value: ethers.parseEther("1") });
    await swapToken
      .connect(addr1)
      .removeLiquidity(ethers.ZeroAddress, ethers.parseEther("0.5"));
    expect(
      await ethers.provider.getBalance(await swapToken.getAddress())
    ).to.equal(ethers.parseEther("0.5"));
  });

  it("Should correctly calculate swap amounts", async function () {
    await swapToken
      .connect(addr1)
      .addLiquidity(await testToken.getAddress(), 5000);
    await swapToken
      .connect(addr1)
      .addLiquidity(ethers.ZeroAddress, 0, { value: ethers.parseEther("1") });

    const swapAmount = await swapToken.calculateSwap(
      await testToken.getAddress(),
      ethers.ZeroAddress,
      1000
    );
    expect(swapAmount).to.be.gt(0);
  });

  it("Should allow swapping tokens for ETH", async function () {
    await swapToken
      .connect(addr1)
      .addLiquidity(await testToken.getAddress(), 5000);
    await swapToken
      .connect(addr1)
      .addLiquidity(ethers.ZeroAddress, 0, { value: ethers.parseEther("1") });

    const initialBalance = await ethers.provider.getBalance(addr1.address);

    await swapToken
      .connect(addr1)
      .swap(await testToken.getAddress(), ethers.ZeroAddress, 1000);

    const newBalance = await ethers.provider.getBalance(addr1.address);
    expect(newBalance).to.be.gt(initialBalance);
  });
});
