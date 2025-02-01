// scripts/verifyDeployment.js
const hre = require("hardhat");

async function main() {
  try {
    const eventManagerAddress = process.env.EVENT_MANAGER_ADDRESS;
    console.log("Checking EventManager at:", eventManagerAddress);

    const WaveXEventManager = await hre.ethers.getContractFactory("WaveXEventManager");
    const eventManager = WaveXEventManager.attach(eventManagerAddress);

    // Check if the contract is accessible
    const owner = await eventManager.owner();
    console.log("Contract owner:", owner);
    
    // Get the NFT contract address from EventManager
    const nftAddress = await eventManager.nftContract();
    console.log("NFT Contract Address:", nftAddress);

  } catch (error) {
    console.error("Error verifying deployment:", error);
    if (error.message.includes("not deployed")) {
      console.log("\nThe EventManager contract might not be deployed at this address.");
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error);