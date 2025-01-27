// scripts/metadata/fixSVGImage.js
const axios = require('axios');
const hre = require("hardhat");
const FormData = require('form-data');

async function uploadSVGToPinata(svgContent) {
    try {
        console.log('\nUploading SVG to Pinata...');
        const form = new FormData();
        
        // Create a Buffer from the SVG content
        const buffer = Buffer.from(svgContent);
        
        // Append the file to form data
        form.append('file', buffer, {
            filename: 'nft-image.svg',
            contentType: 'image/svg+xml'
        });

        // Add Pinata metadata
        const metadata = JSON.stringify({
            name: 'WaveX NFT Image',
            keyvalues: {
                type: 'image/svg+xml'
            }
        });
        form.append('pinataMetadata', metadata);

        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'pinata_api_key': process.env.PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.PINATA_API_SECRET
                }
            }
        );

        return response.data.IpfsHash;
    } catch (error) {
        console.error('Error uploading SVG:', error);
        throw error;
    }
}

async function uploadMetadataToPinata(metadata) {
    try {
        console.log('\nUploading metadata to Pinata...');
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
        return response.data.IpfsHash;
    } catch (error) {
        console.error('Error uploading metadata:', error);
        throw error;
    }
}

async function main() {
    try {
        const tokenId = "1";
        const contractAddress = "0x834CC08A746D9A08d013EEaBBe294786F1F2a917";

        // Create SVG content
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250">
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
        console.log('Uploading SVG image...');
        const imageHash = await uploadSVGToPinata(svgContent);
        console.log('SVG uploaded successfully. IPFS Hash:', imageHash);

        // Create and upload metadata
        const metadata = {
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

        // Upload metadata
        const metadataHash = await uploadMetadataToPinata(metadata);
        console.log('Metadata uploaded successfully. IPFS Hash:', metadataHash);

        // Update contract
        console.log('\nUpdating contract...');
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const contract = WaveXNFT.attach(contractAddress);

        const tx = await contract.setTokenURI(tokenId, `ipfs://${metadataHash}`);
        console.log('Waiting for transaction confirmation...');
        await tx.wait();

        console.log('\nUpdate Summary:');
        console.log('===============');
        console.log('1. SVG Image:');
        console.log('   IPFS Hash:', imageHash);
        console.log('   Gateway URL:', `https://gateway.pinata.cloud/ipfs/${imageHash}`);
        console.log('2. Metadata:');
        console.log('   IPFS Hash:', metadataHash);
        console.log('   Gateway URL:', `https://gateway.pinata.cloud/ipfs/${metadataHash}`);
        console.log('3. Transaction Hash:', tx.hash);

        console.log('\nVerification Steps:');
        console.log('1. Check SVG image:', `https://gateway.pinata.cloud/ipfs/${imageHash}`);
        console.log('2. Check metadata:', `https://gateway.pinata.cloud/ipfs/${metadataHash}`);
        console.log('3. View on OpenSea:', `https://testnets.opensea.io/assets/amoy/${contractAddress}/${tokenId}`);

    } catch (error) {
        console.error('Error:', error);
        throw error;
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
    uploadSVGToPinata,
    uploadMetadataToPinata
};