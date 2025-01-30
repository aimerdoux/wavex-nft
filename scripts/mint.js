// scripts/mint.js
const hre = require("hardhat");
require('dotenv').config();

async function main() {
    try {
        // Get batch size from environment variable, default to 1 if not specified
        const batchSize = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) : 1;

        // Get contract address from environment variable
        const contractAddress = process.env.CONTRACT_ADDRESS;
        if (!contractAddress) {
            throw new Error("CONTRACT_ADDRESS not found in environment variables");
        }

        console.log("\nUsing contract address:", contractAddress);
        console.log("Batch size:", batchSize);
        
        // Get contract instance
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get current supply and limits
        const totalSupply = await wavexNFT.totalSupply();
        const maxSupply = await wavexNFT.MAX_SUPPLY();
        const remainingSupply = maxSupply - totalSupply;

        console.log("\nCurrent Status:");
        console.log("===============");
        console.log(`Total Supply: ${totalSupply}`);
        console.log(`Maximum Supply: ${maxSupply}`);
        console.log(`Remaining Supply: ${remainingSupply}`);

        // Validate batch size
        if (batchSize > remainingSupply) {
            throw new Error(`Batch size ${batchSize} exceeds remaining supply of ${remainingSupply}`);
        }

        // Configure gas settings for Polygon Amoy
        const gasSettings = {
            maxFeePerGas: hre.ethers.parseUnits("50", "gwei"),
            maxPriorityFeePerGas: hre.ethers.parseUnits("25", "gwei"),
            gasLimit: 500000 * batchSize // Increase gas limit for batch minting
        };

        // Perform batch minting
        console.log(`\nInitiating batch mint of ${batchSize} tokens...`);
        
        const mintedTokenIds = [];
        for (let i = 0; i < batchSize; i++) {
            console.log(`\nMinting token ${i + 1} of ${batchSize}...`);
            const tx = await wavexNFT.mint(gasSettings);
            console.log("Waiting for transaction confirmation...");
            const receipt = await tx.wait();
            
            // Get the minted token ID
            const currentTokenId = await wavexNFT.totalSupply();
            mintedTokenIds.push(currentTokenId.toString());
            
            console.log(`Token ${i + 1} minted - ID: ${currentTokenId}`);
            console.log("Transaction Hash:", receipt.hash);
        }

        // Get final supply numbers
        const newTotalSupply = await wavexNFT.totalSupply();
        const newRemainingSupply = maxSupply - newTotalSupply;

        // Log results
        console.log("\nBatch Minting Results:");
        console.log("=====================");
        console.log("Minted Token IDs:", mintedTokenIds.join(", "));
        
        console.log("\nUpdated Status:");
        console.log("===============");
        console.log(`New Total Supply: ${newTotalSupply}`);
        console.log(`New Remaining Supply: ${newRemainingSupply}`);

        return {
            success: true,
            tokenIds: mintedTokenIds
        };

    } catch (error) {
        console.error("\nError during minting:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Execute if called directly
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;