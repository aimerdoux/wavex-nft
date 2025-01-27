// scripts/deployFixed.js
const hre = require("hardhat");
const { ethers } = require("hardhat");
const axios = require('axios');

async function uploadToIPFS(data) {
    const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
    const response = await axios.post(url, data, {
        headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': process.env.PINATA_API_KEY,
            'pinata_secret_api_key': process.env.PINATA_API_SECRET
        }
    });
    return response.data.IpfsHash;
}

async function main() {
    try {
        console.log("Deploying fixed WaveX NFT contract...");

        // Deploy contract
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const wavexNFT = await WaveXNFT.deploy();
        await wavexNFT.waitForDeployment();

        console.log("Contract deployed to:", await wavexNFT.getAddress());

        // Upload initial metadata
        const metadata = {
            name: "WaveX NFT #1",
            description: "WaveX Luxury Experience NFT - Access exclusive benefits and experiences",
            image: "ipfs://QmQoccAoLYbTJf99Qq7b78kJ1V2BsFYTZK9icbrA9Z1aZU",
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

        console.log("Uploading metadata to IPFS...");
        const metadataHash = await uploadToIPFS(metadata);
        const metadataURI = `ipfs://${metadataHash}`;

        // Mint token
        console.log("Minting initial token...");
        const mintTx = await wavexNFT.mint();
        await mintTx.wait();

        // Set token URI
        console.log("Setting token URI...");
        const setURITx = await wavexNFT.setTokenURI(1, metadataURI);
        await setURITx.wait();

        // Verify setup
        const tokenURI = await wavexNFT.tokenURI(1);
        
        console.log("\nDeployment Summary:");
        console.log("==================");
        console.log("Contract Address:", await wavexNFT.getAddress());
        console.log("Token #1 URI:", tokenURI);
        console.log("Metadata URL:", `https://gateway.pinata.cloud/ipfs/${metadataHash}`);
        console.log("\nVerification Steps:");
        console.log("1. Check metadata:", `https://gateway.pinata.cloud/ipfs/${metadataHash}`);
        console.log("2. Import to MetaMask using contract address");
        console.log("3. View on OpenSea (after a few minutes)");

    } catch (error) {
        console.error("Error during deployment:", error);
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

module.exports = main;