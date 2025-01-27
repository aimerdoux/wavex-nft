// scripts/metadata/verifyLinks.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function checkIPFSLink(ipfsHash) {
    try {
        const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        const response = await axios.get(gatewayUrl);
        return {
            success: true,
            status: response.status,
            contentType: response.headers['content-type'],
            size: response.headers['content-length']
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

async function main() {
    try {
        console.log("Verifying IPFS links...\n");

        // Read the URI index
        const uriIndexPath = path.join(__dirname, '../../metadata/index/uri-index.json');
        const uriIndex = JSON.parse(fs.readFileSync(uriIndexPath));

        // Check NFT metadata
        console.log("Checking NFT Metadata:");
        console.log("=====================");
        const nftHash = uriIndex.nftVisualURI.replace('ipfs://', '');
        const nftResult = await checkIPFSLink(nftHash);
        console.log(`NFT Visual Metadata: ${nftResult.success ? '✅' : '❌'}`);
        if (nftResult.success) {
            console.log(`Content Type: ${nftResult.contentType}`);
            console.log(`Size: ${nftResult.size} bytes`);
        }

        // Check card images
        console.log("\nChecking Card Images:");
        console.log("===================");
        for (const [tier, uri] of Object.entries(uriIndex.cardImages)) {
            const hash = uri.replace('ipfs://', '');
            const result = await checkIPFSLink(hash);
            console.log(`${tier} Card: ${result.success ? '✅' : '❌'}`);
            if (result.success) {
                console.log(`Content Type: ${result.contentType}`);
                console.log(`Size: ${result.size} bytes\n`);
            }
        }

        // Verify on OpenSea-compatible URL
        const tokenId = uriIndex.tokenId;
        const baseHash = uriIndex.baseURI.replace('ipfs://', '').replace('/', '');
        console.log("\nNFT Marketplace URLs:");
        console.log("====================");
        console.log(`OpenSea-compatible URL: ipfs://${baseHash}/${tokenId}`);
        console.log(`Direct IPFS Gateway: https://gateway.pinata.cloud/ipfs/${baseHash}/${tokenId}`);
        
        // Print verification steps
        console.log("\nVerification Steps:");
        console.log("==================");
        console.log("1. Check the NFT on OpenSea (when available on network)");
        console.log("2. Direct IPFS gateway links:");
        console.log(`   - Metadata: https://gateway.pinata.cloud/ipfs/${nftHash}`);
        Object.entries(uriIndex.cardImages).forEach(([tier, uri]) => {
            const hash = uri.replace('ipfs://', '');
            console.log(`   - ${tier} Image: https://gateway.pinata.cloud/ipfs/${hash}`);
        });

    } catch (error) {
        console.error("\nError verifying links:", error);
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