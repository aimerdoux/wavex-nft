// scripts/metadata/completeNFTUpload.js
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

async function uploadToPinata(data, options = {}) {
    try {
        const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
        const formData = new FormData();
        
        if (options.filepath) {
            formData.append('file', fs.createReadStream(options.filepath));
        } else {
            formData.append('file', new Blob([data], { type: options.contentType }));
        }

        const response = await axios.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_API_SECRET
            }
        });

        return {
            success: true,
            ipfsHash: response.data.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
        };
    } catch (error) {
        console.error('Error uploading to Pinata:', error);
        return { success: false, error: error.message };
    }
}

async function uploadNFTImage() {
    const svgContent = `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
        <!-- Card Background -->
        <defs>
            <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#FFA500;stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect width="400" height="250" rx="15" fill="url(#cardGradient)" />
        <rect x="40" y="100" width="50" height="40" rx="5" fill="#C0C0C0" />
        <rect x="50" y="110" width="30" height="20" fill="#DAA520" />
        <text x="40" y="50" font-family="Arial" font-size="24" font-weight="bold" fill="white">WaveX</text>
        <text x="40" y="75" font-family="Arial" font-size="16" fill="white">GOLD MEMBER</text>
        <text x="40" y="180" font-family="monospace" font-size="20" fill="white">**** **** **** 0001</text>
        <text x="40" y="210" font-family="Arial" font-size="12" fill="white">VALID THRU: 12/25</text>
        <circle cx="350" cy="50" r="30" fill="white" fill-opacity="0.1" />
        <circle cx="350" cy="50" r="20" fill="white" fill-opacity="0.2" />
    </svg>`;

    console.log('\nUploading NFT image to IPFS...');
    return await uploadToPinata(svgContent, { contentType: 'image/svg+xml' });
}

async function uploadAndUpdateNFT(tokenId, contractAddress) {
    try {
        // Upload image first
        const imageResult = await uploadNFTImage();
        if (!imageResult.success) {
            throw new Error('Failed to upload NFT image');
        }

        console.log('\nImage uploaded successfully:');
        console.log('IPFS Hash:', imageResult.ipfsHash);
        console.log('Gateway URL:', imageResult.url);

        // Create metadata with uploaded image
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

        // Save metadata to file
        const metadataDir = path.join(__dirname, '../../metadata/opensea');
        if (!fs.existsSync(metadataDir)) {
            fs.mkdirSync(metadataDir, { recursive: true });
        }

        const metadataPath = path.join(metadataDir, `${tokenId}.json`);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

        // Upload metadata
        console.log('\nUploading metadata...');
        const metadataResult = await uploadToPinata(
            JSON.stringify(metadata),
            { contentType: 'application/json' }
        );

        if (!metadataResult.success) {
            throw new Error('Failed to upload metadata');
        }

        // Update contract
        console.log('\nUpdating contract base URI...');
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        const baseURI = `ipfs://${metadataResult.ipfsHash}/`;
        const tx = await wavexNFT.setBaseURI(baseURI, {
            maxFeePerGas: hre.ethers.parseUnits("50", "gwei"),
            maxPriorityFeePerGas: hre.ethers.parseUnits("25", "gwei"),
            gasLimit: 500000
        });

        console.log('Waiting for transaction confirmation...');
        await tx.wait();

        console.log('\nNFT Update Summary:');
        console.log('==================');
        console.log('1. Image:');
        console.log('   - IPFS Hash:', imageResult.ipfsHash);
        console.log('   - URL:', imageResult.url);
        console.log('2. Metadata:');
        console.log('   - IPFS Hash:', metadataResult.ipfsHash);
        console.log('   - URL:', metadataResult.url);
        console.log('3. Contract Update:');
        console.log('   - Transaction Hash:', tx.hash);
        console.log('   - Base URI:', baseURI);
        
        console.log('\nVerification Steps:');
        console.log('1. View image:', imageResult.url);
        console.log('2. View metadata:', metadataResult.url);
        console.log('3. OpenSea (wait 5-10 minutes):', 
            `https://testnets.opensea.io/assets/amoy/${contractAddress}/${tokenId}`);

        return {
            success: true,
            imageHash: imageResult.ipfsHash,
            metadataHash: metadataResult.ipfsHash,
            transactionHash: tx.hash
        };

    } catch (error) {
        console.error('\nError:', error);
        throw error;
    }
}

// Execute if run directly
if (require.main === module) {
    const tokenId = process.env.TOKEN_ID || "1";
    const contractAddress = process.env.CONTRACT_ADDRESS || "0x9EBCEB56bc3D83c52058d7770A360bA3DBCF3589";

    uploadAndUpdateNFT(tokenId, contractAddress)
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    uploadAndUpdateNFT
};