// scripts/mint.js
const hre = require("hardhat");
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const parseArgs = () => {
    // Remove hardhat arguments
    const relevantArgs = process.argv.slice(process.argv.indexOf("mint.js") + 1);
    const options = {
        type: 'single',
        quantity: 1
    };

    if (relevantArgs.includes('--batch')) {
        options.type = 'batch';
        const quantityIndex = relevantArgs.indexOf('--batch') + 1;
        if (quantityIndex < relevantArgs.length) {
            options.quantity = parseInt(relevantArgs[quantityIndex]) || 1;
        }
    }

    return options;
};

async function getDeployment(networkName) {
    const deploymentPath = path.join(__dirname, '../deployments', `${networkName}_deployment.json`);
    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`No deployment found for network ${networkName}`);
    }
    return JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
}

async function main() {
    try {
        // Parse arguments
        const options = parseArgs();

        // Get deployment information
        const networkName = hre.network.name;
        const deployment = await getDeployment(networkName);
        
        // Get contract instance
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const wavexNFT = WaveXNFT.attach(deployment.contractAddress);

        // Get current supply and limits
        const currentTokenId = await wavexNFT.getCurrentTokenId();
        const maxSupply = await wavexNFT.MAX_SUPPLY();
        const maxBatchMint = await wavexNFT.MAX_BATCH_MINT();

        console.log("\nCurrent Status:");
        console.log("===============");
        console.log(`Current Token ID: ${currentTokenId}`);
        console.log(`Maximum Supply: ${maxSupply}`);
        console.log(`Maximum Batch Size: ${maxBatchMint}`);
        console.log(`Remaining Supply: ${maxSupply - currentTokenId}`);

        // Validate minting parameters
        if (options.type === 'batch' && options.quantity > maxBatchMint) {
            throw new Error(`Batch size ${options.quantity} exceeds maximum of ${maxBatchMint}`);
        }

        console.log("\nMinting Configuration:");
        console.log("=====================");
        console.log(`Mint Type: ${options.type}`);
        console.log(`Quantity: ${options.quantity}`);

        // Perform minting
        console.log("\nInitiating minting process...");
        let tx;
        let receipt;

        if (options.type === 'batch') {
            console.log(`Batch minting ${options.quantity} tokens...`);
            tx = await wavexNFT.batchMint(options.quantity);
        } else {
            console.log("Minting single token...");
            tx = await wavexNFT.mint();
        }

        console.log("Waiting for transaction confirmation...");
        receipt = await tx.wait();

        // Get minted token IDs
        let mintedTokenIds;
        if (options.type === 'batch') {
            const event = receipt.logs.find(log => {
                try {
                    return wavexNFT.interface.parseLog(log).name === "BatchMinted";
                } catch {
                    return false;
                }
            });
            
            if (event) {
                mintedTokenIds = wavexNFT.interface.parseLog(event).args.tokenIds;
            }
        } else {
            mintedTokenIds = [currentTokenId + 1n];
        }

        // Log results
        console.log("\nMinting Results:");
        console.log("===============");
        console.log("Transaction Hash:", receipt.hash);
        console.log("Block Number:", receipt.blockNumber);
        console.log("Gas Used:", receipt.gasUsed.toString());
        
        if (mintedTokenIds) {
            console.log("\nMinted Token IDs:");
            mintedTokenIds.forEach(tokenId => {
                console.log(`- Token ID: ${tokenId.toString()}`);
            });
        }

        // Update supply info
        const newTokenId = await wavexNFT.getCurrentTokenId();
        console.log("\nUpdated Status:");
        console.log("===============");
        console.log(`New Current Token ID: ${newTokenId}`);
        console.log(`Remaining Supply: ${maxSupply - newTokenId}`);

        return {
            success: true,
            transactionHash: receipt.hash,
            tokenIds: mintedTokenIds.map(id => id.toString())
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