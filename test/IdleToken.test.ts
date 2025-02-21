import { expect } from "chai";
import { ethers } from "hardhat";

describe("IdleToken", function () {
  let IdleToken: any, idleToken: any, owner: any, addr1: any, addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    IdleToken = await ethers.getContractFactory("IdleToken");
    idleToken = await IdleToken.deploy(owner.address);
    await idleToken.waitForDeployment();
  });

  it("should deploy with correct initial supply", async function () {
    const balance = await idleToken.balanceOf(owner.address);
    expect(balance).to.equal(ethers.parseEther("1000000000"));
  });

  it("should mint tokens", async function () {
    await idleToken.mint(addr1.address, ethers.parseEther("100"));
    const balance = await idleToken.balanceOf(addr1.address);
    expect(balance).to.equal(ethers.parseEther("100"));
  });

  it("should burn tokens", async function () {
    await idleToken.burn(ethers.parseEther("50"));
    const balance = await idleToken.balanceOf(owner.address);
    expect(balance).to.equal(ethers.parseEther("999999950"));
  });

  it("should not allow non-owner to mint", async function () {
    await expect(
      idleToken.connect(addr1).mint(addr1.address, ethers.parseEther("100"))
    ).to.be.revertedWithCustomError(idleToken, "OwnableUnauthorizedAccount");
  });


  it("should allow whitelisted users to claim tokens", async function () {
    await idleToken.addToWhitelist(addr1.address);
    await idleToken.claimToken(addr1.address, ethers.parseEther("10"));
    const balance = await idleToken.balanceOf(addr1.address);
    expect(balance).to.equal(ethers.parseEther("10"));
  });

  it("should not allow non-whitelisted users to claim tokens", async function () {
    await expect(
      idleToken.claimToken(addr1.address, ethers.parseEther("10"))
    ).to.be.revertedWith("Not in whitelist");
  });

  it("should update token URI", async function () {
    await idleToken.setTokenURI("https://example.com/token.json");
    expect(await idleToken.tokenURI()).to.equal("https://example.com/token.json");
  });
});
