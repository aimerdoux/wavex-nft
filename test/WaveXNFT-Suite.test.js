// WaveXNFT-Suite.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("WaveXNFT Critical Tests", function () {
  let WaveXNFT;
  let wavexNFT;
  let owner;
  let merchant;
  let user1;
  let user2;

  const BenefitType = {
    MERCHANT_ALLOWANCE: 0,
    YACHT_EVENT: 1,
    DISCOUNT: 2
  };

  beforeEach(async function () {
    WaveXNFT = await ethers.getContractFactory("WaveXNFT");
    [owner, merchant, user1, user2] = await ethers.getSigners();
    wavexNFT = await WaveXNFT.deploy();
  });

  describe("Benefit Expiration", function() {
    it("Should correctly enforce benefit expiration", async function() {
      // 1. Setup: Mint token and add benefit
      await wavexNFT.connect(user1).mint();
      const tokenId = await wavexNFT.getCurrentTokenId();
      
      // 2. Get current block timestamp
      const startBlock = await ethers.provider.getBlock('latest');
      const startTime = startBlock.timestamp;
      console.log('Start timestamp:', startTime);

      // 3. Add benefit with 30-day duration
      const durationInDays = 30;
      const duration = durationInDays * 24 * 60 * 60; // Convert to seconds
      await wavexNFT.addBenefit(
        tokenId,
        BenefitType.DISCOUNT,
        100,
        durationInDays
      );

      // 4. Verify benefit details
      let benefits = await wavexNFT.getBenefits(tokenId);
      console.log('Benefit expiration:', benefits[0].expirationTime.toString());
      console.log('Expected expiration:', startTime + duration);

      // 5. Test redemption before expiration
      await ethers.provider.send('evm_setNextBlockTimestamp', [startTime + duration - 60]); // 1 minute before expiration
      await ethers.provider.send('evm_mine');
      
      const midBlock = await ethers.provider.getBlock('latest');
      console.log('Pre-expiration timestamp:', midBlock.timestamp);
      
      // Should succeed - not expired yet
      await wavexNFT.connect(user1).redeemBenefit(tokenId, 0, 0);

      // 6. Add another benefit for expiration test
      await wavexNFT.addBenefit(
        tokenId,
        BenefitType.DISCOUNT,
        100,
        durationInDays
      );

      // 7. Move time past expiration
      const expirationTime = startTime + duration + 3600; // 1 hour after expiration
      await ethers.provider.send('evm_setNextBlockTimestamp', [expirationTime]);
      await ethers.provider.send('evm_mine');

      const endBlock = await ethers.provider.getBlock('latest');
      console.log('Post-expiration timestamp:', endBlock.timestamp);

      // 8. Get updated benefit details
      benefits = await wavexNFT.getBenefits(tokenId);
      console.log('Benefit 2 expiration:', benefits[1].expirationTime.toString());
      console.log('Current timestamp:', endBlock.timestamp);

      // 9. Verify the benefit has expired
      const isExpired = endBlock.timestamp > benefits[1].expirationTime;
      console.log('Is expired:', isExpired);

      // 10. Attempt to redeem expired benefit
      await expect(
        wavexNFT.connect(user1).redeemBenefit(tokenId, 1, 0)
      ).to.be.revertedWith("Benefit expired");
    });
  });
});