const hre = require("hardhat");

async function main() {
  // Get the contract factory
  const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
  
  // Deploy the contract
  console.log("Deploying WaveXNFT...");
  const wavexNFT = await WaveXNFT.deploy();
  
  // Wait for the contract to be deployed
  await wavexNFT.waitForDeployment();
  
  // Get the deployed contract address
  const contractAddress = await wavexNFT.getAddress();
  
  console.log("WaveXNFT deployed to:", contractAddress);

  // Optionally verify the contract on Polygonscan
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log("Contract verified on Polygonscan");
  } catch (error) {
    console.error("Verification failed:", error);
  }
}

// Recommended pattern for handling deployment errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment error:", error);
    process.exit(1);
  });