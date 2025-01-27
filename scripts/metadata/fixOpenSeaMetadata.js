// scripts/metadata/fixOpenSeaMetadata.js
const hre = require("hardhat");
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function uploadToIPFS(data, name) {
    try {
        console.log(`\nUploading ${name} to IPFS...`);
        
        const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                'pinata_api_key': process.env.PINATA_API_KEY,
                'pinata_secret_api_key': process.env.PINATA_API_SECRET
            }
        });

        return {
            success: true,
            ipfsHash: response.data.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
        };
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        return { success: false, error: error.message };
    }
}

async function fixOpenSeaMetadata(contractAddress, tokenId) {
    try {
        console.log('\nStarting OpenSea metadata fix...');

        // First, create and upload the image (SVG)
        const svgContent = `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#FFA500;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="400" height="250" rx="15" fill="url(#cardGradient)" />
            <text x="40" y="50" font-family="Arial" font-size="24" font-weight="bold" fill="white">WaveX</text>
            <text x="40" y="75" font-family="Arial" font-size="16" fill="white">GOLD MEMBER</text>
            <text x="40" y="180" font-family="monospace" font-size="20" fill="white">#${tokenId.toString().padStart(4, '0')}</text>
        </svg>`;

        console.log('Uploading image to IPFS...');
        const imageResult = await uploadToIPFS({ content: svgContent, name: 'nft.svg' }, 'NFT Image');
        
        if (!imageResult.success) {
            throw new Error('Failed to upload image');
        }

        // Create metadata with correct ipfs:// format
        const metadata = {
            name: `WaveX NFT #${tokenId}`,
            description: "WaveX Luxury Experience NFT - Access exclusive benefits and experiences",
            image: `ipfs://${imageResult.ipfsHash}`,
            external_url: `https://wavex.com/nft/${tokenId}`,
            attributes: [
                {
                    trait_type: "Membership Tier",
                    value: "GOLD"
                },
                {
                    trait_type: "Card Type",
                    value: "Premium"
                },
                {
                    trait_type: "Valid Until",
                    value: "2025-12-31"
                }
            ]
        };

        // Upload metadata to IPFS
        console.log('\nUploading metadata to IPFS...');
        const metadataResult = await uploadToIPFS(metadata, 'Token Metadata');
        
        if (!metadataResult.success) {
            throw new Error('Failed to upload metadata');
        }

        // Update contract
        console.log('\nUpdating contract token URI...');
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const contract = WaveXNFT.attach(contractAddress);

        const newTokenURI = `ipfs://${metadataResult.ipfsHash}`;
        
        // Configure gas settings for Polygon Amoy
        const gasSettings = {
            maxFeePerGas: hre.ethers.parseUnits("50", "gwei"),
            maxPriorityFeePerGas: hre.ethers.parseUnits("25", "gwei"),
            gasLimit: 500000
        };

        const tx = await contract.setBaseURI(newTokenURI, gasSettings);
        console.log('Waiting for transaction confirmation...');
        await tx.wait();

        // Verify the update
        const updatedTokenURI = await contract.tokenURI(tokenId);

        console.log('\nMetadata Update Summary:');
        console.log('=======================');
        console.log('1. Image:');
        console.log('   IPFS Hash:', imageResult.ipfsHash);
        console.log('   IPFS URI:', `ipfs://${imageResult.ipfsHash}`);
        console.log('   Gateway URL:', imageResult.url);
        
        console.log('\n2. Metadata:');
        console.log('   IPFS Hash:', metadataResult.ipfsHash);
        console.log('   IPFS URI:', newTokenURI);
        console.log('   Gateway URL:', metadataResult.url);
        
        console.log('\n3. Contract Update:');
        console.log('   Transaction Hash:', tx.hash);
        console.log('   Updated Token URI:', updatedTokenURI);

        console.log('\nVerification Steps:');
        console.log('1. Check metadata:', metadataResult.url);
        console.log('2. OpenSea URL:', `https://testnets.opensea.io/assets/amoy/${contractAddress}/${tokenId}`);
        console.log('\nImportant Notes:');
        console.log('- Image URL in metadata uses ipfs:// protocol');
        console.log('- Token URI is set to direct IPFS hash');
        console.log('- Wait 5-10 minutes for OpenSea to refresh');
        console.log('- Use OpenSea\'s refresh metadata button if needed');

        return {
            success: true,
            imageHash: imageResult.ipfsHash,
            metadataHash: metadataResult.ipfsHash,
            transactionHash: tx.hash
        };

    } catch (error) {
        console.error('\nError fixing metadata:', error);
        throw error;
    }
}

// Execute if run directly
if (require.main === module) {
    const tokenId = process.env.TOKEN_ID || "1";
    const contractAddress = process.env.CONTRACT_ADDRESS || "0x9EBCEB56bc3D83c52058d7770A360bA3DBCF3589";

    fixOpenSeaMetadata(contractAddress, tokenId)
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    fixOpenSeaMetadata
};