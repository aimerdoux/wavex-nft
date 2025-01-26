const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WaveXNFT Benefit Management", function () {
  let WaveXNFT;
  let wavexNFT;
  let owner;
  let addr1;
  let addr2;

  // Benefit type enum mapping
  const BenefitType = {
    MERCHANT_ALLOWANCE: 0,
    YACHT_EVENT: 1,
    DISCOUNT: 2
  };

  beforeEach(async function () {
    // Get the ContractFactory and Signers
    WaveXNFT = await ethers.getContractFactory("WaveXNFT");
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the contract
    wavexNFT = await WaveXNFT.deploy();

    // Mint a token for testing
    await wavexNFT.connect(addr1).mint();
  });

  describe("Adding Benefits", function () {
    it("Should allow owner to add a benefit to a token", async function () {
      const tokenId = await wavexNFT.getCurrentTokenId();
      const benefitValue = 100;
      const durationInDays = 30;

      // Add benefit
      const tx = await wavexNFT.addBenefit(
        tokenId, 
        BenefitType.DISCOUNT, 
        benefitValue, 
        durationInDays
      );
      const receipt = await tx.wait();

      // Check event emission
      const event = receipt.logs.find(log => log.fragment.name === "BenefitAdded");
      expect(event).to.exist;

      // Retrieve benefits
      const benefits = await wavexNFT.getBenefits(tokenId);
      expect(benefits.length).to.equal(1);
      expect(benefits[0].benefitType).to.equal(BenefitType.DISCOUNT);
      expect(benefits[0].value).to.equal(benefitValue);
    });

    it("Should prevent non-owners from adding benefits", async function () {
      const tokenId = await wavexNFT.getCurrentTokenId();

      // Try to add benefit from non-owner account
      await expect(
        wavexNFT.connect(addr1).addBenefit(
          tokenId, 
          BenefitType.DISCOUNT, 
          100, 
          30
        )
      ).to.be.revertedWithCustomError(wavexNFT, "OwnableUnauthorizedAccount");
    });

    it("Should prevent adding benefit to non-existent token", async function () {
      const nonExistentTokenId = 9999;

      await expect(
        wavexNFT.addBenefit(
          nonExistentTokenId, 
          BenefitType.DISCOUNT, 
          100, 
          30
        )
      ).to.be.revertedWithCustomError(wavexNFT, "ERC721NonexistentToken");
    });
  });

  // Rest of the test suite remains the same...
});