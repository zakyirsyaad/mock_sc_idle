const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenSwap", function () {
  let Token1, Token2, token1, token2, TokenSwap, swap, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    Token1 = await ethers.getContractFactory("ERC20Token");
    token1 = await Token1.deploy(
      "Token1",
      "TK1",
      owner.address,
      ethers.utils.parseUnits("1000", 18)
    );
    await token1.deployed();

    Token2 = await ethers.getContractFactory("IdleToken");
    token2 = await Token2.deploy(
      "Token2",
      "TK2",
      owner.address,
      ethers.utils.parseUnits("1000", 18)
    );
    await token2.deployed();

    TokenSwap = await ethers.getContractFactory("TokenSwap");
    swap = await TokenSwap.deploy(token1.address, token2.address, 2);
    await swap.deployed();

    await token1.transfer(user.address, ethers.utils.parseUnits("100", 18));
    await token2.transfer(swap.address, ethers.utils.parseUnits("200", 18));
  });

  it("should swap tokens correctly", async function () {
    await token1
      .connect(user)
      .approve(swap.address, ethers.utils.parseUnits("50", 18));
    await swap.connect(user).swap(ethers.utils.parseUnits("50", 18));

    expect(await token1.balanceOf(user.address)).to.equal(
      ethers.utils.parseUnits("50", 18)
    );
    expect(await token2.balanceOf(user.address)).to.equal(
      ethers.utils.parseUnits("100", 18)
    );
  });

  it("should add liquidity correctly", async function () {
    await token1.approve(swap.address, ethers.utils.parseUnits("100", 18));
    await token2.approve(swap.address, ethers.utils.parseUnits("200", 18));
    await swap.addLiquidity(
      ethers.utils.parseUnits("100", 18),
      ethers.utils.parseUnits("200", 18)
    );

    expect(await token1.balanceOf(swap.address)).to.equal(
      ethers.utils.parseUnits("100", 18)
    );
    expect(await token2.balanceOf(swap.address)).to.equal(
      ethers.utils.parseUnits("400", 18)
    );
  });

  it("should remove liquidity correctly", async function () {
    await swap.removeLiquidity(
      ethers.utils.parseUnits("50", 18),
      ethers.utils.parseUnits("100", 18)
    );

    expect(await token1.balanceOf(owner.address)).to.equal(
      ethers.utils.parseUnits("950", 18)
    );
    expect(await token2.balanceOf(owner.address)).to.equal(
      ethers.utils.parseUnits("900", 18)
    );
  });
});
