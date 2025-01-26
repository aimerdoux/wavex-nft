// scripts/batchMint.js
const hre = require("hardhat");
const path = require('path');
const fs = require('fs');

async function getDeployment(networkName) {
    const deploymentPath = path.join(__dirname, '../deployments', `${networkName}_deployment.json`);
    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`No deployment found for network ${networkName}`);
    }
    return JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
}

async function main() {
    try {
        // Default to 5 tokens if no amount specified
        const batchSize = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) : 5;
        
        // Get deployment information
        const networkName = hre.network.name;
        const deployment = await getDeployment(networkName);
        
        console.log(`\nPreparing to batch mint on ${networkName}...`);
        console.log(`Contract address: ${deployment.contractAddress}`);
        
        // Get contract instance
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const wavexNFT = WaveXNFT.attach(deployment.contractAddress);

        // Get current supply and limits
        const currentTokenId = await wavexNFT.getCurrentTokenId();
        const maxSupply = await wavexNFT.MAX_SUPPLY();
        const maxBatchMint = await wavexNFT.MAX_BATCH_MINT();
        const remainingSupply = maxSupply - currentTokenId;

        console.log("\nCurrent Status:");
        console.log("===============");
        console.log(`Current Token ID: ${currentTokenId}`);
        console.log(`Maximum Supply: ${maxSupply}`);
        console.log(`Maximum Batch Size: ${maxBatchMint}`);
        console.log(`Remaining Supply: ${remainingSupply}`);
        console.log(`Requested Batch Size: ${batchSize}`);

        // Validate batch size
        if (batchSize > maxBatchMint) {
            throw new Error(`Batch size ${batchSize} exceeds maximum of ${maxBatchMint}`);
        }

        if (batchSize > remainingSupply) {
            throw new Error(`Batch size ${batchSize} exceeds remaining supply of ${remainingSupply}`);
        }

        // Perform batch minting
        console.log(`\nInitiating batch mint of ${batchSize} tokens...`);
        const tx = await wavexNFT.batchMint(batchSize);
        
        console.log("Transaction submitted. Waiting for confirmation...");
        console.log("Transaction hash:", tx.hash);
        
        const receipt = await tx.wait();

        // Get minted token IDs from event
        const event = receipt.logs.find(log => {
            try {
                return wavexNFT.interface.parseLog(log).name === "BatchMinted";
            } catch {
                return false;
            }
        });

        let mintedTokenIds;
        if (event) {
            mintedTokenIds = wavexNFT.interface.parseLog(event).args.tokenIds;
        }

        // Log results
        console.log("\nBatch Minting Results:");
        console.log("======================");
        console.log("Transaction hash:", receipt.hash);
        console.log("Block number:", receipt.blockNumber);
        console.log("Gas used:", receipt.gasUsed.toString());
        
        if (mintedTokenIds) {
            console.log("\nMinted Token IDs:");
            mintedTokenIds.forEach(tokenId => {
                console.log(`- Token ID: ${tokenId.toString()}`);
            });
        }

        // Get updated supply info
        const newTokenId = await wavexNFT.getCurrentTokenId();
        console.log("\nUpdated Status:");
        console.log("===============");
        console.log(`New Current Token ID: ${newTokenId}`);
        console.log(`New Remaining Supply: ${maxSupply - newTokenId}`);

        return {
            success: true,
            transactionHash: receipt.hash,
            tokenIds: mintedTokenIds.map(id => id.toString())
        };

    } catch (error) {
        console.error("\nError during batch minting:", error);
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