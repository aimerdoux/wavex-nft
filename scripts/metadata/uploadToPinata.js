// scripts/metadata/uploadToPinata.js
const hre = require("hardhat");
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const PinataManager = require('../utils/pinataUtils');

async function uploadMetadataAndUpdateReferences(pinata, tokenId, metadataDir) {
    try {
        console.log(`\nProcessing metadata for Token ID: ${tokenId}`);

        // Read the metadata files
        const metadataTypes = ['nft_visual', 'prepaid_card', 'apple_wallet'];
        const uploadedData = {};

        for (const type of metadataTypes) {
            const filePath = path.join(metadataDir, type, `${tokenId}.json`);
            if (fs.existsSync(filePath)) {
                console.log(`\nUploading ${type} metadata...`);
                const metadata = JSON.parse(fs.readFileSync(filePath));
                
                // Upload to Pinata
                const result = await pinata.uploadJSON(
                    metadata,
                    `wavex-${type}-${tokenId}`
                );
                
                console.log(`${type} metadata uploaded to IPFS:`);
                console.log(`Hash: ${result.IpfsHash}`);
                console.log(`URL: ${result.url}`);
                
                uploadedData[type] = {
                    ipfsHash: result.IpfsHash,
                    url: result.url
                };
            }
        }

        // Create a metadata index file
        const metadataIndex = {
            tokenId: tokenId,
            created: new Date().toISOString(),
            metadata: uploadedData
        };

        // Save metadata index locally
        const indexPath = path.join(metadataDir, 'index', `${tokenId}.json`);
        if (!fs.existsSync(path.join(metadataDir, 'index'))) {
            fs.mkdirSync(path.join(metadataDir, 'index'), { recursive: true });
        }
        fs.writeFileSync(indexPath, JSON.stringify(metadataIndex, null, 2));

        return metadataIndex;

    } catch (error) {
        console.error("Error uploading metadata:", error);
        throw error;
    }
}

async function main() {
    try {
        // Initialize Pinata with your credentials
        const pinata = new PinataManager(
            process.env.PINATA_API_KEY,
            process.env.PINATA_API_SECRET,
            process.env.PINATA_JWT
        );

        const tokenId = process.env.TOKEN_ID;
        if (!tokenId) {
            throw new Error("Please provide TOKEN_ID in environment variables");
        }

        // Path to metadata directory
        const metadataDir = path.join(__dirname, '../../metadata');

        // Upload metadata and get references
        console.log("\nStarting metadata upload to IPFS via Pinata...");
        const metadataIndex = await uploadMetadataAndUpdateReferences(
            pinata,
            tokenId,
            metadataDir
        );

        console.log("\nMetadata Upload Summary:");
        console.log("=======================");
        console.log(JSON.stringify(metadataIndex, null, 2));

        return metadataIndex;

    } catch (error) {
        console.error("\nError in upload process:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;