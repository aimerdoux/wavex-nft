// scripts/updateNFTMetadata.js
const hre = require("hardhat");
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
require('dotenv').config();

// NFT Configuration templates
const NFT_CONFIGS = {
    1: {
        name: "WaveX Gold VIP Pass",
        description: "Access exclusive VIP benefits and luxury experiences with WaveX Gold membership",
        imageFolder: "gold",
        imageName: "gold.jpg",
        benefits: [
            { type: "MERCHANT_ALLOWANCE", value: "2000 USDC annual spending" },
            { type: "YACHT_EVENT", value: "2 premium yacht events per year" },
            { type: "CLUB_ACCESS", value: "Priority VIP club access" }
        ],
        attributes: [
            { trait_type: "Membership Tier", value: "GOLD" },
            { trait_type: "Card Type", value: "Premium" },
            { trait_type: "Valid Until", value: "2025-12-31" }
        ]
    },
    2: {
        name: "WaveX Platinum Elite Pass",
        description: "Experience ultimate luxury with WaveX Platinum Elite membership",
        imageFolder: "platinum",
        imageName: "platinum.jpg",
        benefits: [
            { type: "MERCHANT_ALLOWANCE", value: "5000 USDC annual spending" },
            { type: "YACHT_EVENT", value: "4 premium yacht events per year" },
            { type: "PRIVATE_JET", value: "2 private jet transfers annually" }
        ],
        attributes: [
            { trait_type: "Membership Tier", value: "PLATINUM" },
            { trait_type: "Card Type", value: "Elite" },
            { trait_type: "Valid Until", value: "2025-12-31" }
        ]
    },
    3: {
        name: "WaveX Black Diamond Pass",
        description: "The pinnacle of luxury experiences with WaveX Black Diamond membership",
        imageFolder: "black",
        imageName: "black.jpg",
        benefits: [
            { type: "MERCHANT_ALLOWANCE", value: "Unlimited annual spending" },
            { type: "YACHT_EVENT", value: "Unlimited yacht access" },
            { type: "CONCIERGE", value: "24/7 personal concierge service" }
        ],
        attributes: [
            { trait_type: "Membership Tier", value: "BLACK" },
            { trait_type: "Card Type", value: "Diamond" },
            { trait_type: "Valid Until", value: "2025-12-31" }
        ]
    },
    4: {
        name: "WaveX CyberPunk  Pass",
        description: "The pinnacle of luxury experiences with WaveX Diamond membership",
        imageFolder: "cyberpunk",
        imageName: "cyberpunk.jpg",
        benefits: [
            { type: "MERCHANT_ALLOWANCE", value: "Unlimited annual spending" },
            { type: "YACHT_EVENT", value: "Unlimited yacht access" },
            { type: "CONCIERGE", value: "24/7 personal concierge service" }
        ],
        attributes: [
            { trait_type: "Membership Tier", value: "CYBERPUNK" },
            { trait_type: "Card Type", value: "Diamond" },
            { trait_type: "Valid Until", value: "2025-12-31" }
        ]
    }
};

async function uploadImage(tokenId) {
    try {
        const config = NFT_CONFIGS[tokenId];
        if (!config) {
            throw new Error(`No configuration found for token ID ${tokenId}`);
        }

        // Construct the correct image path based on the folder structure
        const imagePath = path.join(
            __dirname, 
            '../assets/card-designs', 
            config.imageFolder, 
            config.imageName
        );

        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image not found: ${imagePath}`);
        }

        console.log(`Reading image from: ${imagePath}`);
        const imageContent = fs.readFileSync(imagePath);
        
        const formData = new FormData();
        formData.append('file', imageContent, {
            filename: config.imageName,
            contentType: 'image/jpeg'
        });

        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'pinata_api_key': process.env.PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.PINATA_API_SECRET
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        return {
            success: true,
            ipfsHash: response.data.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
        };
    } catch (error) {
        console.error('Error uploading image:', error);
        return { success: false, error: error.message };
    }
}

async function uploadMetadata(metadata) {
    try {
        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinJSONToIPFS',
            metadata,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': process.env.PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.PINATA_API_SECRET
                }
            }
        );

        return {
            success: true,
            ipfsHash: response.data.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
        };
    } catch (error) {
        console.error('Error uploading metadata:', error);
        return { success: false, error: error.message };
    }
}

async function updateNFTMetadata(tokenId) {
    try {
        console.log(`\nUpdating metadata for NFT #${tokenId}...`);

        // Get NFT configuration
        const config = NFT_CONFIGS[tokenId];
        if (!config) {
            throw new Error(`No configuration found for token ID ${tokenId}`);
        }

        // Upload image first
        console.log('\nUploading image...');
        const imageResult = await uploadImage(tokenId);
        if (!imageResult.success) {
            throw new Error(`Failed to upload image: ${imageResult.error}`);
        }

        console.log('Image uploaded successfully:', imageResult.url);

        // Create metadata
        const metadata = {
            name: config.name,
            description: config.description,
            image: `ipfs://${imageResult.ipfsHash}`,
            attributes: config.attributes,
            benefits: config.benefits
        };

        // Upload metadata
        console.log('\nUploading metadata...');
        const metadataResult = await uploadMetadata(metadata);
        if (!metadataResult.success) {
            throw new Error('Failed to upload metadata');
        }

        console.log('Metadata uploaded successfully:', metadataResult.url);

        // Update contract
        console.log('\nUpdating contract...');
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const contract = WaveXNFT.attach(process.env.CONTRACT_ADDRESS);

        // Configure gas settings for Polygon Amoy
        const gasSettings = {
            maxFeePerGas: hre.ethers.parseUnits("50", "gwei"),
            maxPriorityFeePerGas: hre.ethers.parseUnits("25", "gwei"),
            gasLimit: 500000
        };

        const tx = await contract.setTokenURI(tokenId, `ipfs://${metadataResult.ipfsHash}`, gasSettings);
        console.log('Waiting for transaction confirmation...');
        await tx.wait();

        console.log('\nUpdate Summary:');
        console.log('===============');
        console.log('Token ID:', tokenId);
        console.log('Image IPFS Hash:', imageResult.ipfsHash);
        console.log('Image URL:', imageResult.url);
        console.log('Metadata IPFS Hash:', metadataResult.ipfsHash);
        console.log('Metadata URL:', metadataResult.url);
        console.log('Transaction Hash:', tx.hash);

        return {
            success: true,
            tokenId,
            imageHash: imageResult.ipfsHash,
            metadataHash: metadataResult.ipfsHash,
            transactionHash: tx.hash
        };

    } catch (error) {
        console.error(`\nError updating NFT #${tokenId}:`, error);
        return { success: false, error: error.message };
    }
}

async function main() {
    try {
        // Get token ID from command line or environment
        const tokenId = process.env.BASE_TOKEN_ID 
            ? parseInt(process.env.BASE_TOKEN_ID) 
            : parseInt(process.argv[2]);

        if (isNaN(tokenId)) {
            throw new Error("Please provide a valid TOKEN_ID");
        }

        const result = await updateNFTMetadata(tokenId);
        if (!result.success) {
            throw new Error(result.error);
        }

        console.log('\nMetadata update completed successfully!');
    } catch (error) {
        console.error('\nError in main process:', error);
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

module.exports = {
    updateNFTMetadata,
    NFT_CONFIGS
};