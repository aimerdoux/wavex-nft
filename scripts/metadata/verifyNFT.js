// scripts/metadata/verifyNFT.js
const hre = require("hardhat");
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function verifyIPFSContent(ipfsHash) {
    const gateways = [
        'https://gateway.pinata.cloud/ipfs/',
        'https://ipfs.io/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/'
    ];

    console.log(`\nChecking IPFS hash ${ipfsHash} across gateways:`);
    
    for (const gateway of gateways) {
        try {
            const response = await axios.get(`${gateway}${ipfsHash}`, { timeout: 5000 });
            console.log(`✓ ${gateway} - Status: ${response.status}`);
            console.log(`  Content-Type: ${response.headers['content-type']}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.log(`✗ ${gateway} - Error: ${error.message}`);
        }
    }
    
    return { success: false };
}

async function verifyNFTMetadata(contractAddress, tokenId) {
    try {
        console.log('\nStarting NFT metadata verification...');
        console.log('=====================================');

        // 1. Get contract instance and check base URI
        console.log('\n1. Checking Contract Configuration:');
        console.log('--------------------------------');
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const contract = WaveXNFT.attach(contractAddress);

        // Check if token exists
        try {
            const owner = await contract.ownerOf(tokenId);
            console.log('✓ Token exists');
            console.log(`  Owner: ${owner}`);
        } catch (error) {
            console.log('✗ Token does not exist');
            return;
        }

        // Try to get base URI using a call to tokenURI
        const tokenURI = await contract.tokenURI(tokenId);
        console.log('\nToken URI:', tokenURI);

        // 2. Parse and verify IPFS content
        console.log('\n2. Verifying IPFS Content:');
        console.log('-------------------------');
        
        // Extract IPFS hash from tokenURI
        const ipfsHash = tokenURI.replace('ipfs://', '').replace('/', '');
        const metadataResult = await verifyIPFSContent(ipfsHash);

        if (metadataResult.success) {
            console.log('\nMetadata Content:');
            console.log(JSON.stringify(metadataResult.data, null, 2));

            // 3. Verify image if present in metadata
            if (metadataResult.data.image) {
                console.log('\n3. Verifying Image:');
                console.log('------------------');
                const imageHash = metadataResult.data.image.replace('ipfs://', '');
                await verifyIPFSContent(imageHash);
            }
        }

        // 4. Check contract events
        console.log('\n4. Checking Recent Contract Events:');
        console.log('--------------------------------');
        const filter = contract.filters.Transfer(null, null, tokenId);
        const events = await contract.queryFilter(filter);
        
        if (events.length > 0) {
            console.log(`Found ${events.length} transfer events for token ${tokenId}`);
            events.forEach((event, index) => {
                console.log(`\nEvent ${index + 1}:`);
                console.log(`From: ${event.args[0]}`);
                console.log(`To: ${event.args[1]}`);
                console.log(`Token ID: ${event.args[2]}`);
                console.log(`Block: ${event.blockNumber}`);
            });
        }

        // 5. OpenSea API check (if available)
        console.log('\n5. OpenSea Integration:');
        console.log('----------------------');
        console.log(`OpenSea URL: https://testnets.opensea.io/assets/amoy/${contractAddress}/${tokenId}`);
        console.log('Note: Manual refresh on OpenSea might be needed');

        // 6. Summary
        console.log('\nVerification Summary:');
        console.log('===================');
        console.log(`Contract Address: ${contractAddress}`);
        console.log(`Token ID: ${tokenId}`);
        console.log(`Token URI: ${tokenURI}`);
        console.log(`Metadata IPFS Hash: ${ipfsHash}`);
        if (metadataResult.data?.image) {
            console.log(`Image IPFS Hash: ${metadataResult.data.image.replace('ipfs://', '')}`);
        }

        return {
            success: true,
            tokenURI,
            metadata: metadataResult.data
        };

    } catch (error) {
        console.error('\nError during verification:', error);
        throw error;
    }
}

// Execute if run directly
if (require.main === module) {
    const tokenId = process.env.TOKEN_ID || "1";
    const contractAddress = process.env.CONTRACT_ADDRESS || "0x9EBCEB56bc3D83c52058d7770A360bA3DBCF3589";

    verifyNFTMetadata(contractAddress, tokenId)
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    verifyNFTMetadata,
    verifyIPFSContent
};