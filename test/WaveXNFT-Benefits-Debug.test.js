const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WaveXNFT Benefit Management - Diagnostic", function () {
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

  describe("Debug: Benefit Addition Checks", function () {
    it("Detailed Error Diagnostic for Non-Owner Benefit Addition", async function () {
      const tokenId = await wavexNFT.getCurrentTokenId();

      try {
        await wavexNFT.connect(addr1).addBenefit(
          tokenId, 
          BenefitType.DISCOUNT, 
          100, 
          30
        );
        
        // If no error is thrown, fail the test
        expect.fail("Transaction should have been reverted");
      } catch (error) {
        // Log full error details for investigation
        console.log("Error Details:");
        console.log("Name:", error.name);
        console.log("Message:", error.message);
        console.log("Stack Trace:", error.stack);

        // Verify it's a revert
        expect(error.message).to.include("revert");
      }
    });

    it("Detailed Error Diagnostic for Non-Existent Token", async function () {
      const nonExistentTokenId = 9999;

      try {
        await wavexNFT.addBenefit(
          nonExistentTokenId, 
          BenefitType.DISCOUNT, 
          100, 
          30
        );
        
        // If no error is thrown, fail the test
        expect.fail("Transaction should have been reverted");
      } catch (error) {
        // Log full error details for investigation
        console.log("Error Details for Non-Existent Token:");
        console.log("Name:", error.name);
        console.log("Message:", error.message);
        console.log("Stack Trace:", error.stack);

        // Verify it's a revert
        expect(error.message).to.include("revert");
      }
    });

    it("Raw Contract Interaction Diagnostic", async function () {
      const tokenId = await wavexNFT.getCurrentTokenId();

      // Direct low-level call to investigate
      const addBenefitTx = await owner.sendTransaction({
        to: wavexNFT.target,
        data: wavexNFT.interface.encodeFunctionData("addBenefit", [
          tokenId,
          BenefitType.DISCOUNT,
          100,
          30
        ])
      });

      const receipt = await addBenefitTx.wait();
      console.log("Transaction Receipt:", receipt);
    });
  });
});