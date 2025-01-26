// scripts/metadata/setTokenURI.js
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function getDeployment(networkName) {
    const deploymentPath = path.join(__dirname, '../../deployments', `${networkName}_deployment.json`);
    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`No deployment found for network ${networkName}`);
    }
    return JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
}

async function setTokenURI() {
    try {
        console.log("Starting Token URI update process...");

        // Get deployment information
        const networkName = hre.network.name;
        const deployment = await getDeployment(networkName);
        
        // Get contract instance
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const wavexNFT = WaveXNFT.attach(deployment.contractAddress);

        // Read the metadata index
        const metadataDir = path.join(__dirname, '../../metadata/index');
        const indexFile = path.join(metadataDir, '1_complete.json');
        
        if (!fs.existsSync(indexFile)) {
            throw new Error("Complete metadata index not found. Please run the complete setup first.");
        }

        const metadataIndex = JSON.parse(fs.readFileSync(indexFile));

        // Set base URI using the nft_visual metadata as the primary URI
        const baseURI = `ipfs://${metadataIndex.metadata.nft_visual.ipfsHash}/`;
        console.log(`Setting base URI to: ${baseURI}`);
        
        const tx = await wavexNFT.setBaseURI(baseURI);
        await tx.wait();
        console.log("Base URI updated successfully");

        // Save additional URIs in a separate JSON file
        const uriIndex = {
            tokenId: metadataIndex.tokenId,
            baseURI,
            nftVisualURI: `ipfs://${metadataIndex.metadata.nft_visual.ipfsHash}`,
            prepaidCardURI: `ipfs://${metadataIndex.metadata.prepaid_card.ipfsHash}`,
            appleWalletURI: `ipfs://${metadataIndex.metadata.apple_wallet.ipfsHash}`,
            completeIndex: `ipfs://${metadataIndex.indexHash}`,
            cardImages: {
                BLACK: `ipfs://${metadataIndex.cardImages.BLACK.IpfsHash}`,
                PLATINUM: `ipfs://${metadataIndex.cardImages.PLATINUM.IpfsHash}`,
                GOLD: `ipfs://${metadataIndex.cardImages.GOLD.IpfsHash}`
            },
            updatedAt: new Date().toISOString()
        };

        // Save URI index
        const uriIndexPath = path.join(metadataDir, 'uri-index.json');
        fs.writeFileSync(uriIndexPath, JSON.stringify(uriIndex, null, 2));

        // Print verification information
        console.log("\nURI Update Summary:");
        console.log("==================");
        console.log(JSON.stringify(uriIndex, null, 2));

        // Verify token URI
        const tokenURI = await wavexNFT.tokenURI(metadataIndex.tokenId);
        console.log("\nToken URI Verification:");
        console.log("======================");
        console.log(`Token ${metadataIndex.tokenId} URI: ${tokenURI}`);

        return uriIndex;

    } catch (error) {
        console.error("\nError updating token URI:", error);
        process.exit(1);
    }
}

// Add verification function
async function verifyURIs() {
    try {
        const networkName = hre.network.name;
        const deployment = await getDeployment(networkName);
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const wavexNFT = WaveXNFT.attach(deployment.contractAddress);

        // Read URI index
        const uriIndexPath = path.join(__dirname, '../../metadata/index/uri-index.json');
        if (!fs.existsSync(uriIndexPath)) {
            throw new Error("URI index not found. Please set token URI first.");
        }

        const uriIndex = JSON.parse(fs.readFileSync(uriIndexPath));
        const tokenId = uriIndex.tokenId;

        console.log("\nVerifying URIs for token", tokenId);
        console.log("-------------------------");

        // Verify base URI
        const baseURI = await wavexNFT.tokenURI(tokenId);
        console.log(`Base URI match: ${baseURI === uriIndex.baseURI + tokenId}`);

        // Print all available URIs
        console.log("\nAvailable URIs:");
        console.log("---------------");
        console.log(`NFT Visual: ${uriIndex.nftVisualURI}`);
        console.log(`Prepaid Card: ${uriIndex.prepaidCardURI}`);
        console.log(`Apple Wallet: ${uriIndex.appleWalletURI}`);
        console.log(`Complete Index: ${uriIndex.completeIndex}`);
        
        console.log("\nCard Design Images:");
        console.log("-----------------");
        Object.entries(uriIndex.cardImages).forEach(([tier, uri]) => {
            console.log(`${tier}: ${uri}`);
        });

    } catch (error) {
        console.error("\nError verifying URIs:", error);
        process.exit(1);
    }
}

async function main() {
    await setTokenURI();
    await verifyURIs();
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    setTokenURI,
    verifyURIs
};