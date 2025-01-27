// scripts/metadata/checkAndFixImage.js
const axios = require('axios');
const hre = require("hardhat");

async function checkMetadata(metadataUrl) {
    try {
        console.log('\nChecking current metadata...');
        const response = await axios.get(metadataUrl);
        console.log('Current metadata structure:', JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error('Error fetching metadata:', error.message);
        return null;
    }
}

async function uploadToIPFS(content) {
    try {
        console.log('\nUploading to IPFS...');
        const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
        const response = await axios.post(url, content, {
            headers: {
                'Content-Type': 'application/json',
                'pinata_api_key': process.env.PINATA_API_KEY,
                'pinata_secret_api_key': process.env.PINATA_API_SECRET
            }
        });
        return response.data.IpfsHash;
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw error;
    }
}

async function fixMetadataWithSVG(contractAddress, tokenId, currentMetadata) {
    try {
        // Create SVG image
        const svgImage = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250">
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
        </svg>`;

        // Upload SVG
        const imageContent = {
            name: `WaveX_NFT_${tokenId}_Image.svg`,
            content: svgImage
        };
        
        console.log('Uploading SVG image...');
        const imageHash = await uploadToIPFS(imageContent);
        
        // Create updated metadata
        const updatedMetadata = {
            name: `WaveX NFT #${tokenId}`,
            description: "WaveX Luxury Experience NFT - Access exclusive benefits and experiences",
            image: `ipfs://${imageHash}`,
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

        // Upload updated metadata
        console.log('Uploading updated metadata...');
        const metadataHash = await uploadToIPFS(updatedMetadata);

        // Update contract
        console.log('Updating contract...');
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const contract = WaveXNFT.attach(contractAddress);

        const tx = await contract.setTokenURI(tokenId, `ipfs://${metadataHash}`);
        console.log('Waiting for transaction confirmation...');
        await tx.wait();

        console.log('\nUpdate Summary:');
        console.log('===============');
        console.log('1. New Image:');
        console.log('   IPFS Hash:', imageHash);
        console.log('   Gateway URL:', `https://gateway.pinata.cloud/ipfs/${imageHash}`);
        console.log('2. New Metadata:');
        console.log('   IPFS Hash:', metadataHash);
        console.log('   Gateway URL:', `https://gateway.pinata.cloud/ipfs/${metadataHash}`);
        console.log('3. Transaction Hash:', tx.hash);

        console.log('\nVerification Steps:');
        console.log('1. Check image:', `https://gateway.pinata.cloud/ipfs/${imageHash}`);
        console.log('2. Check metadata:', `https://gateway.pinata.cloud/ipfs/${metadataHash}`);
        console.log('3. View on OpenSea (wait 5-10 minutes):', 
            `https://testnets.opensea.io/assets/amoy/${contractAddress}/${tokenId}`);

        return {
            imageHash,
            metadataHash,
            transactionHash: tx.hash
        };

    } catch (error) {
        console.error('Error fixing metadata:', error);
        throw error;
    }
}

async function main() {
    const tokenId = "1";
    const contractAddress = "0x834CC08A746D9A08d013EEaBBe294786F1F2a917";
    const metadataUrl = "https://gateway.pinata.cloud/ipfs/QmT9HAdsPHDM73owxqfZLBkNnwatUcfUKRetZnwTLKEyV5";

    // Check current metadata
    const currentMetadata = await checkMetadata(metadataUrl);
    if (!currentMetadata) {
        console.log('Unable to fetch current metadata. Creating new metadata...');
    }

    // Fix metadata with embedded SVG
    await fixMetadataWithSVG(contractAddress, tokenId, currentMetadata);
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
    checkMetadata,
    fixMetadataWithSVG
};