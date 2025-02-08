// scripts/deploy/setupMerchants.js
const hre = require("hardhat");
require('dotenv').config();

async function setupMerchants() {
    try {
        console.log("Starting WaveX V2 merchant setup...");

        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        if (!contractAddress) {
            throw new Error("WAVEX_NFT_V2_ADDRESS not found in environment");
        }

        console.log("Contract address:", contractAddress);

        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get gas settings from network config
        const networkConfig = hre.config.networks[hre.network.name];
        console.log('\nUsing network gas settings:', {
            gasPrice: networkConfig.gasPrice ? hre.ethers.formatUnits(networkConfig.gasPrice, 'gwei') + ' gwei' : 'Not set',
            gasLimit: networkConfig.gasLimit || 'Not set'
        });

        const gasSettings = {
            gasPrice: networkConfig.gasPrice,
            gasLimit: 100000 // Lower gas limit for merchant operations
        };

        const merchants = [
            {
                address: process.env.MERCHANT_ADDRESS,
                name: "Primary Merchant",
                type: "MAIN"
            }
        ];

        // Validate merchant addresses
        if (!merchants[0].address) {
            throw new Error("MERCHANT_ADDRESS not found in environment");
        }

        console.log("\nProcessing merchants...");
        for (const merchant of merchants) {
            console.log(`\nProcessing merchant: ${merchant.name} (${merchant.address})`);
            
            try {
                const isAuthorized = await wavexNFT.authorizedMerchants(merchant.address);
                if (!isAuthorized) {
                    console.log(`Authorizing merchant...`);
                    const tx = await wavexNFT.authorizeMerchant(
                        merchant.address,
                        gasSettings
                    );
                    console.log(`Transaction sent: ${tx.hash}`);
                    console.log('Waiting for confirmation...');
                    await tx.wait();
                    console.log("Authorization successful");
                } else {
                    console.log(`Merchant already authorized`);
                }
            } catch (error) {
                console.error(`Error processing merchant:`, error.message);
                throw error;
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
            console.log(`Type: ${result.type}`);
            console.log(`Status: ${result.authorized ? '✅ Authorized' : '❌ Not Authorized'}`);
        });

        return { successful: true, merchants: verificationResults };

    } catch (error) {
        console.error("\nError in merchant setup:");
        console.error('- Message:', error.message);
        console.error('- Stack:', error.stack);
        if (error.code) console.error('- Code:', error.code);
        if (error.reason) console.error('- Reason:', error.reason);
        if (error.data) console.error('- Data:', error.data);
        throw error;
    }
}

// Export the function
module.exports = setupMerchants;

// Run setup if called directly
if (require.main === module) {
    setupMerchants()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}