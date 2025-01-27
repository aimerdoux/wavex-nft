// scripts/metadata/verifyAndFixMetadata.js
const hre = require("hardhat");
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function checkIPFSContent(ipfsHash) {
    try {
        const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        const response = await axios.get(url);
        return {
            success: true,
            data: response.data,
            contentType: response.headers['content-type']
        };
    } catch (error) {
        console.error(`Error accessing IPFS hash ${ipfsHash}:`, error.message);
        return { success: false, error: error.message };
    }
}

async function uploadToIPFS(content, options = {}) {
    try {
        const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
        
        // Prepare the data based on content type
        const data = options.type === 'image' 
            ? { image: content } 
            : content;

        // Add Pinata-specific metadata
        const requestBody = {
            pinataOptions: {
                cidVersion: 1
            },
            pinataMetadata: {
                name: options.name || 'WaveX NFT Content',
                keyvalues: {
                    tokenId: options.tokenId || '1',
                    contentType: options.type || 'metadata'
                }
            },
            pinataContent: data
        };

        console.log(`Uploading ${options.type || 'content'} to IPFS...`);
        
        const response = await axios.post(url, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'pinata_api_key': process.env.PINATA_API_KEY,
                'pinata_secret_api_key': process.env.PINATA_API_SECRET
            }
        });

        console.log('Upload successful!');
        return {
            success: true,
            ipfsHash: response.data.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
        };
    } catch (error) {
        console.error('Error uploading to IPFS:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        return { success: false, error: error.message };
    }
}

async function verifyAndFixMetadata(contractAddress, tokenId) {
    try {
        console.log('\nStarting metadata verification and fix process...');
        
        // 1. Check current contract state
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const contract = WaveXNFT.attach(contractAddress);
        
        console.log('\nChecking current contract state...');
        const currentTokenURI = await contract.tokenURI(tokenId);
        console.log('Current Token URI:', currentTokenURI);

        // 2. Create and upload new image content
        console.log('\nPreparing NFT image...');
        const imageContent = {
            version: 1,
            type: "svg",
            content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250">
                <defs>
                    <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#FFA500;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="400" height="250" rx="15" fill="url(#cardGradient)" />
                <text x="40" y="50" font-family="Arial" font-size="24" font-weight="bold" fill="white">WaveX</text>
                <text x="40" y="80" font-family="Arial" font-size="16" fill="white">GOLD MEMBER</text>
                <text x="40" y="200" font-family="monospace" font-size="20" fill="white">Token #${tokenId}</text>
            </svg>`
        };

        const imageResult = await uploadToIPFS(
            imageContent,
            { 
                name: `WaveX_NFT_${tokenId}_Image`,
                type: 'image',
                tokenId 
            }
        );

        if (!imageResult.success) {
            throw new Error(`Failed to upload image: ${imageResult.error}`);
        }

        // 3. Create and upload metadata
        console.log('\nPreparing and uploading metadata...');
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
                }
            ]
        };

        const metadataResult = await uploadToIPFS(
            metadata,
            { 
                name: `WaveX_NFT_${tokenId}_Metadata`,
                type: 'metadata',
                tokenId 
            }
        );

        if (!metadataResult.success) {
            throw new Error(`Failed to upload metadata: ${metadataResult.error}`);
        }

        // 4. Update contract
        console.log('\nUpdating contract...');
        const baseURI = `ipfs://${metadataResult.ipfsHash}`;
        
        const tx = await contract.setBaseURI(baseURI, {
            maxFeePerGas: hre.ethers.parseUnits("50", "gwei"),
            maxPriorityFeePerGas: hre.ethers.parseUnits("25", "gwei"),
            gasLimit: 500000
        });

        console.log('Waiting for transaction confirmation...');
        await tx.wait();

        // 5. Verify final state
        const updatedTokenURI = await contract.tokenURI(tokenId);

        // Save verification info
        const verificationInfo = {
            tokenId,
            contractAddress,
            imageHash: imageResult.ipfsHash,
            metadataHash: metadataResult.ipfsHash,
            transactionHash: tx.hash,
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync(
            'metadata_verification.json',
            JSON.stringify(verificationInfo, null, 2)
        );

        console.log('\nFinal Verification Summary:');
        console.log('=========================');
        console.log('1. Image Content:');
        console.log('   - IPFS Hash:', imageResult.ipfsHash);
        console.log('   - Gateway URL:', imageResult.url);
        
        console.log('\n2. Metadata Content:');
        console.log('   - IPFS Hash:', metadataResult.ipfsHash);
        console.log('   - Gateway URL:', metadataResult.url);
        
        console.log('\n3. Contract Update:');
        console.log('   - Previous URI:', currentTokenURI);
        console.log('   - New URI:', updatedTokenURI);
        console.log('   - Transaction Hash:', tx.hash);

        console.log('\nVerification Steps:');
        console.log('1. Check metadata:', metadataResult.url);
        console.log('2. Check image:', imageResult.url);
        console.log('3. View on OpenSea:', `https://testnets.opensea.io/assets/amoy/${contractAddress}/${tokenId}`);
        console.log('\nNote: Wait a few minutes and refresh OpenSea metadata if needed');

        return verificationInfo;

    } catch (error) {
        console.error('\nError during verification and fix:', error);
        throw error;
    }
}

if (require.main === module) {
    const tokenId = process.env.TOKEN_ID || "1";
    const contractAddress = process.env.CONTRACT_ADDRESS || "0x9EBCEB56bc3D83c52058d7770A360bA3DBCF3589";

    verifyAndFixMetadata(contractAddress, tokenId)
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    verifyAndFixMetadata,
    checkIPFSContent,
    uploadToIPFS
};