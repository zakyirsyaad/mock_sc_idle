import { expect } from "chai";
import { ethers } from "hardhat";

describe("IdleToken", function () {
  let IdleToken: any, idleToken: any, owner: any, addr1: any, addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    IdleToken = await ethers.getContractFactory("IdleToken");
    idleToken = await IdleToken.deploy(owner.address, ethers.parseEther("1"));
    await idleToken.waitForDeployment();
  });

  // Deployment tests
  describe("Deployment", function () {
    it("should deploy with correct initial supply", async function () {
      const balance = await idleToken.balanceOf(owner.address);
      expect(balance).to.equal(ethers.parseEther("1000000000"));
    });

    it("should deploy with correct initial token price", async function () {
      const price = await idleToken.tokenPriceInWei();
      expect(price).to.equal(ethers.parseEther("1"));
    });
  });

  // Minting tests
  describe("Minting", function () {
    it("should mint tokens", async function () {
      await idleToken.mint(addr1.address, ethers.parseEther("100"));
      const balance = await idleToken.balanceOf(addr1.address);
      expect(balance).to.equal(ethers.parseEther("100"));
    });

    it("should not allow non-owner to mint", async function () {
      await expect(
        idleToken.connect(addr1).mint(addr1.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(idleToken, "OwnableUnauthorizedAccount");
    });
  });

  // Burning tests
  describe("Burning", function () {
    it("should burn tokens", async function () {
      await idleToken.burn(ethers.parseEther("50"));
      const balance = await idleToken.balanceOf(owner.address);
      expect(balance).to.equal(ethers.parseEther("999999950"));
    });

    it("should not allow burning more tokens than balance", async function () {
      await expect(
        idleToken.burn(ethers.parseEther("1000000001"))
      ).to.be.revertedWith("Insufficient balance");
    });

    it("should emit TokenBurned event", async function () {
      await expect(idleToken.burn(ethers.parseEther("50")))
        .to.emit(idleToken, "TokenBurned")
        .withArgs(owner.address, ethers.parseEther("50"));
    });
  });

  // Whitelist tests
  describe("Whitelist", function () {
    it("should add to whitelist", async function () {
      await idleToken.addToWhitelist(addr1.address);
      expect(await idleToken.whitelist(addr1.address)).to.be.true;
    });

    it("should remove from whitelist", async function () {
      await idleToken.addToWhitelist(addr1.address);
      await idleToken.removeFromWhitelist(addr1.address);
      expect(await idleToken.whitelist(addr1.address)).to.be.false;
    });

    it("should not allow non-owner to add to whitelist", async function () {
      await expect(
        idleToken.connect(addr1).addToWhitelist(addr1.address)
      ).to.be.revertedWithCustomError(idleToken, "OwnableUnauthorizedAccount");
    });

    it("should not allow non-owner to remove from whitelist", async function () {
      await expect(
        idleToken.connect(addr1).removeFromWhitelist(addr1.address)
      ).to.be.revertedWithCustomError(idleToken, "OwnableUnauthorizedAccount");
    });
  });

  // Claiming tokens tests
  describe("Claiming Tokens", function () {
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

    it("should not allow claiming more tokens than owner balance", async function () {
      await idleToken.addToWhitelist(addr1.address);
      await expect(
        idleToken.claimToken(addr1.address, ethers.parseEther("1000000001"))
      ).to.be.revertedWith("Not enough tokens in owner balance");
    });
  });

  // Token URI tests
  describe("Token URI", function () {
    it("should update token URI", async function () {
      await idleToken.setTokenURI("https://example.com/token.json");
      expect(await idleToken.tokenURI()).to.equal(
        "https://example.com/token.json"
      );
    });

    it("should emit TokenURIUpdated event", async function () {
      await expect(idleToken.setTokenURI("https://example.com/token.json"))
        .to.emit(idleToken, "TokenURIUpdated")
        .withArgs("https://example.com/token.json");
    });

    it("should not allow non-owner to update token URI", async function () {
      await expect(
        idleToken.connect(addr1).setTokenURI("https://example.com/token.json")
      ).to.be.revertedWithCustomError(idleToken, "OwnableUnauthorizedAccount");
    });
  });

  // Token price tests
  describe("Token Price", function () {
    it("should set token price", async function () {
      await idleToken.setTokenPrice(ethers.parseEther("2"));
      const price = await idleToken.tokenPriceInWei();
      expect(price).to.equal(ethers.parseEther("2"));
    });

    it("should not allow non-owner to set token price", async function () {
      await expect(
        idleToken.connect(addr1).setTokenPrice(ethers.parseEther("2"))
      ).to.be.revertedWithCustomError(idleToken, "OwnableUnauthorizedAccount");
    });
  });

  // Receiving ETH tests
  describe("Receiving ETH", function () {
    it("should allow the contract to receive ETH", async function () {
      await owner.sendTransaction({
        to: await idleToken.getAddress(),
        value: ethers.parseEther("1"),
      });
      const balance = await ethers.provider.getBalance(
        await idleToken.getAddress()
      );
      expect(balance).to.equal(ethers.parseEther("1"));
    });
  });
});
