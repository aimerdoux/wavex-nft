const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WaveXNFT Merchant Allowance Management", function () {
  let WaveXNFT;
  let wavexNFT;
  let owner;
  let merchant1;
  let merchant2;
  let tokenHolder;

  // Benefit type enum mapping
  const BenefitType = {
    MERCHANT_ALLOWANCE: 0,
    YACHT_EVENT: 1,
    DISCOUNT: 2
  };

  beforeEach(async function () {
    // Get the ContractFactory and Signers
    WaveXNFT = await ethers.getContractFactory("WaveXNFT");
    [owner, merchant1, merchant2, tokenHolder] = await ethers.getSigners();

    // Deploy the contract
    wavexNFT = await WaveXNFT.deploy();

    // Mint a token for testing
    await wavexNFT.connect(tokenHolder).mint();

    // Add merchant status for merchant1
    await wavexNFT.setMerchantStatus(merchant1.address, true);
  });

  // ... previous tests remain the same ...

  describe("Merchant Allowance Benefit", function () {
    // ... previous tests ...

    it("Should allow partial redemption of merchant allowance", async function () {
      const tokenId = await wavexNFT.getCurrentTokenId();
      const allowanceAmount = 1000;
      const durationInDays = 30;
      const redeemAmount = 300;

      // Add merchant allowance benefit
      await wavexNFT.addBenefit(
        tokenId, 
        BenefitType.MERCHANT_ALLOWANCE, 
        allowanceAmount, 
        durationInDays
      );

      // Redeem partial allowance as an authorized merchant
      await wavexNFT.connect(merchant1).redeemBenefit(tokenId, 0, redeemAmount);

      // Retrieve benefits to check remaining allowance
      const benefits = await wavexNFT.getBenefits(tokenId);
      expect(benefits[0].value).to.equal(700); // Original 1000 - 300
    });

    it("Should prevent redeeming more than available allowance", async function () {
      const tokenId = await wavexNFT.getCurrentTokenId();
      const allowanceAmount = 1000;
      const durationInDays = 30;

      // Add merchant allowance benefit
      await wavexNFT.addBenefit(
        tokenId, 
        BenefitType.MERCHANT_ALLOWANCE, 
        allowanceAmount, 
        durationInDays
      );

      // Try to redeem more than available
      await expect(
        wavexNFT.connect(merchant1).redeemBenefit(tokenId, 0, 1100)
      ).to.be.revertedWith("Insufficient allowance");
    });

    it("Should require authorized merchant for MERCHANT_ALLOWANCE redemption", async function () {
      const tokenId = await wavexNFT.getCurrentTokenId();
      const allowanceAmount = 1000;
      const durationInDays = 30;

      // Add merchant allowance benefit
      await wavexNFT.addBenefit(
        tokenId, 
        BenefitType.MERCHANT_ALLOWANCE, 
        allowanceAmount, 
        durationInDays
      );

      // Try to redeem with non-authorized merchant
      await expect(
        wavexNFT.connect(merchant2).redeemBenefit(tokenId, 0, 300)
      ).to.be.revertedWith("Not an authorized merchant");
    });
  });
});