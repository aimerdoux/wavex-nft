// scripts/deploy/setupMerchants.js
const hre = require("hardhat");
require('dotenv').config({ path: 'V2.env' });

async function setupMerchants() {
    try {
        console.log("Starting WaveX V2 merchant setup...");

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

        const merchants = [
            {
                address: process.env.MERCHANT_ADDRESS,
                name: "Primary Merchant",
                type: "MAIN"
            },
            ...(process.env.ADDITIONAL_MERCHANTS || "").split(",")
                .filter(addr => addr)
                .map(addr => ({
                    address: addr,
                    name: "Additional Merchant",
                    type: "SECONDARY"
                }))
        ];

        console.log("\nProcessing merchants...");
        for (const merchant of merchants) {
            if (!merchant.address) continue;

            const isAuthorized = await wavexNFT.authorizedMerchants(merchant.address);
            if (!isAuthorized) {
                console.log(`\nAuthorizing ${merchant.name} (${merchant.address})...`);
                const tx = await wavexNFT.authorizeMerchant(
                    merchant.address,
                    gasSettings
                );
                await tx.wait();
                console.log("Authorization successful");
            } else {
                console.log(`\n${merchant.name} (${merchant.address}) already authorized`);
            }
        }

        // Verify setup
        console.log("\nVerifying merchant setup...");
        const verificationResults = await Promise.all(
            merchants.map(async merchant => ({
                ...merchant,
                authorized: await wavexNFT.authorizedMerchants(merchant.address)
            }))
        );

        console.log("\nSetup Summary:");
        console.log("==============");
        verificationResults.forEach(result => {
            console.log(`\nMerchant: ${result.name}`);
            console.log(`Address: ${result.address}`);
            console.log(`Status: ${result.authorized ? '✅ Authorized' : '❌ Not Authorized'}`);
        });

        return { successful: true, merchants: verificationResults };

    } catch (error) {
        console.error("\nError in merchant setup:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    setupMerchants()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = setupMerchants;