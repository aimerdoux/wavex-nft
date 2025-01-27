// scripts/metadata/uploadMetadata.js
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Verify environment variables are loaded
const {
    PINATA_API_KEY,
    PINATA_API_SECRET,
    PINATA_JWT,
    CONTRACT_ADDRESS,
    TOKEN_ID,
    MEMBERSHIP_TIER,
    CARD_COLOR
} = process.env;

async function uploadToIPFS(data, name) {
    try {
        console.log(`\nUploading ${name} to IPFS via Pinata...`);
        
        // Verify Pinata credentials
        if (!PINATA_API_KEY || !PINATA_API_SECRET) {
            throw new Error('Pinata credentials not found in environment variables');
        }

        const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_API_SECRET,
                'Authorization': `Bearer ${PINATA_JWT}`
            }
        });

        console.log('IPFS Upload successful');
        return {
            success: true,
            ipfsHash: response.data.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
        };
    } catch (error) {
        console.error('\nError uploading to IPFS:', error.response?.data || error.message);
        return { success: false, error: error.message };
    }
}

async function createAndUploadMetadata(tokenId, contractAddress) {
    try {
        console.log(`\nPreparing metadata for token ${tokenId}...`);

        // Create metadata directory if it doesn't exist
        const metadataDir = path.join(__dirname, '../../metadata/opensea');
        if (!fs.existsSync(metadataDir)) {
            fs.mkdirSync(metadataDir, { recursive: true });
        }

        // Create metadata object
        const metadata = {
            name: `WaveX NFT #${tokenId}`,
            description: "WaveX Luxury Experience NFT - Access exclusive benefits and experiences",
            image: "https://gateway.pinata.cloud/ipfs/QmZ8u69Hjwuxe7XSB4p344DaCtPoHAu9D6v3QE6cnggLRD",
            external_url: `https://wavex.com/nft/${tokenId}`,
            attributes: [
                {
                    trait_type: "Membership Tier",
                    value: MEMBERSHIP_TIER || "GOLD"
                },
                {
                    trait_type: "Card Color",
                    value: CARD_COLOR || "#FFD700"
                },
                {
                    trait_type: "Valid Until",
                    value: "2025-12-31"
                }
            ]
        };

        // Save metadata locally
        const metadataPath = path.join(metadataDir, `${tokenId}.json`);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        console.log('Metadata file saved locally');

        // Upload individual token metadata to IPFS
        console.log('\nUploading token metadata to IPFS...');
        const uploadResult = await uploadToIPFS(metadata, `Token #${tokenId} Metadata`);
        
        if (!uploadResult.success) {
            throw new Error('Failed to upload metadata to IPFS');
        }

        // Create and upload metadata directory
        const allMetadata = {
            [tokenId]: metadata
        };

        console.log('\nUploading complete metadata directory...');
        const directoryResult = await uploadToIPFS(allMetadata, 'Complete Metadata Directory');
        
        if (!directoryResult.success) {
            throw new Error('Failed to upload metadata directory to IPFS');
        }

        // Update contract base URI
        console.log('\nUpdating contract base URI...');
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Configure gas settings for Polygon Amoy
        const gasSettings = {
            maxFeePerGas: hre.ethers.parseUnits("50", "gwei"),
            maxPriorityFeePerGas: hre.ethers.parseUnits("25", "gwei"),
            gasLimit: 500000
        };

        const baseURI = `ipfs://${directoryResult.ipfsHash}/`;
        const tx = await wavexNFT.setBaseURI(baseURI, gasSettings);
        console.log('Waiting for transaction confirmation...');
        await tx.wait();

        console.log('\nMetadata Upload Summary:');
        console.log('=======================');
        console.log('Individual Token Metadata:');
        console.log('- IPFS Hash:', uploadResult.ipfsHash);
        console.log('- Gateway URL:', uploadResult.url);
        console.log('\nComplete Directory:');
        console.log('- IPFS Hash:', directoryResult.ipfsHash);
        console.log('- Gateway URL:', directoryResult.url);
        console.log('\nContract Update:');
        console.log('- Address:', contractAddress);
        console.log('- Transaction Hash:', tx.hash);
        console.log('- Base URI:', baseURI);

        console.log('\nVerification URLs:');
        console.log('1. Token Metadata:', uploadResult.url);
        console.log('2. Directory:', directoryResult.url);
        console.log('3. OpenSea:', `https://testnets.opensea.io/assets/amoy/${contractAddress}/${tokenId}`);

        // Save upload information
        const uploadInfo = {
            tokenId,
            individualHash: uploadResult.ipfsHash,
            directoryHash: directoryResult.ipfsHash,
            timestamp: new Date().toISOString(),
            transactionHash: tx.hash
        };

        const uploadInfoPath = path.join(metadataDir, 'upload_info.json');
        fs.writeFileSync(uploadInfoPath, JSON.stringify(uploadInfo, null, 2));

        return {
            success: true,
            uploadInfo
        };

    } catch (error) {
        console.error('\nError in metadata upload process:', error);
        throw error;
    }
}

// Main execution
if (require.main === module) {
    // Log environment variable status
    console.log('\nEnvironment Configuration:');
    console.log('=========================');
    console.log('PINATA_API_KEY:', PINATA_API_KEY ? 'Set ✓' : 'Missing ✗');
    console.log('PINATA_API_SECRET:', PINATA_API_SECRET ? 'Set ✓' : 'Missing ✗');
    console.log('PINATA_JWT:', PINATA_JWT ? 'Set ✓' : 'Missing ✗');
    console.log('CONTRACT_ADDRESS:', CONTRACT_ADDRESS || 'Using default');
    console.log('TOKEN_ID:', TOKEN_ID || 'Using default');

    // Verify required credentials
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
        console.error('\nError: Missing Pinata credentials in environment variables');
        process.exit(1);
    }

    const tokenId = TOKEN_ID || "1";
    const contractAddress = CONTRACT_ADDRESS || "0x9EBCEB56bc3D83c52058d7770A360bA3DBCF3589";

    createAndUploadMetadata(tokenId, contractAddress)
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    uploadToIPFS,
    createAndUploadMetadata
};