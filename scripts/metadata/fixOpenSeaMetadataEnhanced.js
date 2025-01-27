// scripts/metadata/fixOpenSeaMetadataEnhanced.js
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function verifyMetadataLinks(tokenId) {
    console.log(`\nVerifying metadata links for token ${tokenId}...`);
    
    // Test different IPFS gateways
    const gateways = [
        'https://gateway.pinata.cloud/ipfs/',
        'https://ipfs.io/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/'
    ];

    // Function to test gateway
    async function testGateway(gateway, hash) {
        try {
            const response = await axios.get(`${gateway}${hash}`, { timeout: 5000 });
            return { success: true, gateway };
        } catch (error) {
            return { success: false, gateway };
        }
    }

    // Read the current metadata
    const metadataDir = path.join(__dirname, '../../metadata');
    const nftMetadataPath = path.join(metadataDir, 'opensea', `${tokenId}.json`);
    
    if (!fs.existsSync(nftMetadataPath)) {
        console.log('Metadata file not found, creating new one...');
        return null;
    }

    const metadata = JSON.parse(fs.readFileSync(nftMetadataPath));
    const imageUrl = metadata.image;
    
    // Extract IPFS hash if present
    const ipfsHash = imageUrl.includes('ipfs://')
        ? imageUrl.replace('ipfs://', '')
        : imageUrl.split('/ipfs/')[1];

    console.log('\nTesting IPFS gateways...');
    const gatewayResults = await Promise.all(
        gateways.map(gateway => testGateway(gateway, ipfsHash))
    );

    const workingGateways = gatewayResults
        .filter(result => result.success)
        .map(result => result.gateway);

    return {
        metadata,
        workingGateways,
        ipfsHash
    };
}

async function fixMetadata(tokenId, contractAddress) {
    try {
        console.log(`\nFixing metadata for token ${tokenId}...`);

        // Verify current metadata
        const verificationResult = await verifyMetadataLinks(tokenId);

        // Create metadata directory if it doesn't exist
        const metadataDir = path.join(__dirname, '../../metadata/opensea');
        if (!fs.existsSync(metadataDir)) {
            fs.mkdirSync(metadataDir, { recursive: true });
        }
        
        // Create enhanced metadata
        const enhancedMetadata = {
            name: `WaveX NFT #${tokenId}`,
            description: "WaveX Luxury Experience NFT - Access exclusive benefits and experiences",
            image: "ipfs://QmZ8u69Hjwuxe7XSB4p344DaCtPoHAu9D6v3QE6cnggLRD",
            external_url: `https://wavex.com/nft/${tokenId}`,
            attributes: [
                {
                    trait_type: "Membership Tier",
                    value: "GOLD"
                },
                {
                    trait_type: "Valid Until",
                    value: "2025-12-31"
                }
            ]
        };

        // Save enhanced metadata
        const enhancedPath = path.join(metadataDir, `${tokenId}.json`);
        fs.writeFileSync(enhancedPath, JSON.stringify(enhancedMetadata, null, 2));

        console.log("\nGetting contract instance...");
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Configure gas settings for Polygon Amoy
        const gasSettings = {
            maxFeePerGas: hre.ethers.parseUnits("50", "gwei"),
            maxPriorityFeePerGas: hre.ethers.parseUnits("25", "gwei"),
            gasLimit: 500000
        };

        // Set base URI to IPFS URL
        console.log("Setting base URI...");
        const baseURI = "ipfs://QmZ8u69Hjwuxe7XSB4p344DaCtPoHAu9D6v3QE6cnggLRD/";
        const tx = await wavexNFT.setBaseURI(baseURI, gasSettings);
        console.log("Waiting for transaction confirmation...");
        await tx.wait();

        console.log('\nMetadata Update Summary:');
        console.log('=======================');
        console.log('Contract Address:', contractAddress);
        console.log('Token ID:', tokenId);
        console.log('Base URI:', baseURI);
        console.log('Transaction Hash:', tx.hash);
        
        console.log('\nVerification Steps:');
        console.log('1. Check metadata at:', `https://gateway.pinata.cloud/ipfs/QmZ8u69Hjwuxe7XSB4p344DaCtPoHAu9D6v3QE6cnggLRD/${tokenId}`);
        console.log('2. View on OpenSea testnet:', 
            `https://testnets.opensea.io/assets/amoy/${contractAddress}/${tokenId}`);
        console.log('3. Wait a few minutes for OpenSea to refresh metadata');

        return {
            success: true,
            metadata: enhancedMetadata,
            txHash: tx.hash
        };

    } catch (error) {
        console.error('Error fixing metadata:', error);
        if (error.message.includes("Artifact for contract")) {
            console.error('\nContract name mismatch. Using WaveXNFT instead of WaveXNFTv2');
        }
        throw error;
    }
}

// Execute if run directly
if (require.main === module) {
    const tokenId = process.env.TOKEN_ID || "1";
    const contractAddress = "0xf343a91ecc9a39caeb880ad7802d18f1e38a0420";
    
    fixMetadata(tokenId, contractAddress)
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    verifyMetadataLinks,
    fixMetadata
};