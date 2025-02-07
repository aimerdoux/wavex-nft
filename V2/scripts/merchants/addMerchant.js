// scripts/merchant/addMerchant.js
const hre = require("hardhat");
require('dotenv').config({ path: 'V2.env' });

async function addMerchant() {
    try {
        if (!process.env.NEW_MERCHANT_ADDRESS) {
            throw new Error("NEW_MERCHANT_ADDRESS not found in environment variables");
        }

        console.log("Starting merchant authorization process...");

        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        if (!contractAddress) {
            throw new Error("WAVEX_NFT_V2_ADDRESS not found in environment");
        }

        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Gas settings
        const gasSettings = {
            gasLimit: process.env.GAS_LIMIT || 5000000,
            gasPrice: process.env.GAS_PRICE || 35000000000
        };

        const merchantAddress = process.env.NEW_MERCHANT_ADDRESS;
        console.log(`\nProcessing merchant: ${merchantAddress}`);

        // Check if merchant is already authorized
        const isAuthorized = await wavexNFT.authorizedMerchants(merchantAddress);
        
        if (!isAuthorized) {
            console.log("Authorizing merchant...");
            const tx = await wavexNFT.authorizeMerchant(
                merchantAddress,
                gasSettings
            );
            await tx.wait();
            console.log("✅ Merchant authorized successfully");
        } else {
            console.log("⚠️ Merchant already authorized");
        }

        // Verify final status
        const finalStatus = await wavexNFT.authorizedMerchants(merchantAddress);
        console.log("\nFinal Status:");
        console.log(`Merchant Address: ${merchantAddress}`);
        console.log(`Authorization Status: ${finalStatus ? '✅ Authorized' : '❌ Not Authorized'}`);

    } catch (error) {
        console.error("\nError in merchant authorization:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    addMerchant()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = addMerchant;