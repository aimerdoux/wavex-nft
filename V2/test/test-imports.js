// V2/test/test-imports.js
const { expect } = require("chai");

describe("OpenZeppelin Imports", function () {
  it("Should import OpenZeppelin contracts", async function () {
    const [owner] = await ethers.getSigners();
    const NFTContract = await ethers.getContractFactory("WaveXNFTV2");
    expect(NFTContract).to.not.be.undefined;
  });
});