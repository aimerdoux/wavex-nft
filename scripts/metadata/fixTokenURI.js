// scripts/metadata/fixTokenURI.js
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

async function fixTokenURI(contractAddress, tokenId) {
    try {
        console.log('\nStarting metadata fix process...');
        
        // Create the metadata object
        const metadata = {
            name: `WaveX NFT #${tokenId}`,
            description: "WaveX Luxury Experience NFT - Access exclusive benefits and experiences",
            image: "https://gateway.pinata.cloud/ipfs/QmRNtUZctvatbPgb9yHmxd53cTfZbVNdmKyGEpRooUFW9X",
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

        // Upload the token metadata
        console.log('Uploading token metadata...');
        const metadataResult = await uploadToIPFS(metadata, 'Token Metadata');
        
        if (!metadataResult.success) {
            throw new Error('Failed to upload metadata');
        }

        console.log('\nVerifying metadata accessibility...');
        try {
            const verifyResponse = await axios.get(metadataResult.url);
            console.log('✓ Metadata accessible');
            console.log('✓ Content-Type:', verifyResponse.headers['content-type']);
        } catch (error) {
            console.error('✗ Error accessing metadata:', error.message);
            throw error;
        }

        // Update contract
        console.log('\nUpdating contract metadata...');
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const contract = WaveXNFT.attach(contractAddress);

        // Set the direct IPFS hash as the tokenURI
        const newUri = `ipfs://${metadataResult.ipfsHash}`;
        
        // Configure gas settings for Polygon Amoy
        const gasSettings = {
            maxFeePerGas: hre.ethers.parseUnits("50", "gwei"),
            maxPriorityFeePerGas: hre.ethers.parseUnits("25", "gwei"),
            gasLimit: 500000
        };

        console.log('Setting new base URI...');
        const tx = await contract.setBaseURI(newUri, gasSettings);
        console.log('Waiting for transaction confirmation...');
        await tx.wait();

        // Verify the update
        const updatedTokenURI = await contract.tokenURI(tokenId);
        
        console.log('\nUpdate Summary:');
        console.log('===============');
        console.log('1. New Metadata:');
        console.log('   IPFS Hash:', metadataResult.ipfsHash);
        console.log('   Gateway URL:', metadataResult.url);
        console.log('2. Contract Update:');
        console.log('   Transaction Hash:', tx.hash);
        console.log('   New Token URI:', updatedTokenURI);
        
        console.log('\nVerification Steps:');
        console.log('1. Check metadata:', metadataResult.url);
        console.log('2. Check image:', metadata.image);
        console.log('3. View on OpenSea:', `https://testnets.opensea.io/assets/amoy/${contractAddress}/${tokenId}`);
        console.log('\nNote: Wait 5-10 minutes and use OpenSea\'s refresh metadata button if needed');

        return {
            success: true,
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

    fixTokenURI(contractAddress, tokenId)
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    fixTokenURI
};