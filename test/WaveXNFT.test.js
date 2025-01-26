const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WaveXNFT Minting", function () {
  let WaveXNFT;
  let wavexNFT;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get the ContractFactory and Signers
    WaveXNFT = await ethers.getContractFactory("WaveXNFT");
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the contract
    wavexNFT = await WaveXNFT.deploy();
  });

  describe("Single Minting", function () {
    it("Should mint a single NFT successfully", async function () {
      // Mint an NFT
      const tx = await wavexNFT.connect(addr1).mint();
      const receipt = await tx.wait();

      // Check token ownership
      const tokenId = await wavexNFT.getCurrentTokenId();
      expect(await wavexNFT.ownerOf(Number(tokenId))).to.equal(addr1.address);
    });

    it("Should increment token ID after minting", async function () {
      // Initial token ID
      const initialTokenId = await wavexNFT.getCurrentTokenId();

      // Mint an NFT
      await wavexNFT.connect(addr1).mint();

      // Check new token ID
      const newTokenId = await wavexNFT.getCurrentTokenId();
      expect(Number(newTokenId)).to.equal(Number(initialTokenId) + 1);
    });
  });

  describe("Batch Minting", function () {
    it("Should batch mint multiple NFTs", async function () {
      const batchSize = 5;
      
      // Batch mint NFTs
      const tx = await wavexNFT.connect(addr1).batchMint(batchSize);
      const receipt = await tx.wait();

      // Check batch minted token ownership
      for (let i = 1; i <= batchSize; i++) {
        expect(await wavexNFT.ownerOf(i)).to.equal(addr1.address);
      }
    });

    it("Should prevent minting more than MAX_BATCH_MINT", async function () {
      const maxBatchMint = Number(await wavexNFT.MAX_BATCH_MINT());
      
      // Try to mint more than max batch limit
      await expect(
        wavexNFT.connect(addr1).batchMint(maxBatchMint + 1)
      ).to.be.revertedWith("Exceeds max batch mint limit");
    });

    it("Should prevent minting beyond MAX_SUPPLY", async function () {
      this.timeout(0); // Remove timeout for this test
      
      const maxSupply = Number(await wavexNFT.MAX_SUPPLY());
      
      // Calculate how many full batch mints we can do
      const fullBatches = Math.floor(maxSupply / 20);
      const remainingTokens = maxSupply % 20;

      // Perform full batch mints
      for (let i = 0; i < fullBatches; i++) {
        await wavexNFT.connect(addr1).batchMint(20);
      }

      // Try to mint remaining tokens
      if (remainingTokens > 0) {
        await wavexNFT.connect(addr1).batchMint(remainingTokens);
      }

      // Try to mint one more token
      await expect(
        wavexNFT.connect(addr1).batchMint(1)
      ).to.be.revertedWith("Exceeds max supply");
    });
  });
});