const hre = require("hardhat");
require('dotenv').config({ path: 'V2.env' });

async function setupMerchants() {
    try {
        console.log("Starting WaveX V2 merchant setup...");

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        if (!contractAddress) {
            throw new Error("WAVEX_NFT_V2_ADDRESS not found in environment variables");
        }

        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get signers
        const [owner] = await hre.ethers.getSigners();
        
        // Define merchants to authorize
        const merchants = [
            {
                address: process.env.MERCHANT_ADDRESS || owner.address,
                name: "Wave Restaurant & Club",
                cashiers: [
                    process.env.CASHIER1_ADDRESS,
                    process.env.CASHIER2_ADDRESS
                ]
            }
            // Add more merchants as needed
        ];

        console.log("\nAuthorization Details:");
        console.log("=====================");
        console.log("Contract Address:", contractAddress);
        console.log("Owner Address:", owner.address);

        // Gas settings for Polygon Amoy
        const gasSettings = {
            gasLimit: process.env.GAS_LIMIT || 5000000,
            gasPrice: process.env.GAS_PRICE || 35000000000
        };

        // Process each merchant
        for (const merchant of merchants) {
            console.log(`\nProcessing merchant: ${merchant.name}`);
            console.log("Merchant Address:", merchant.address);

            // Check current merchant status
            const isAuthorized = await wavexNFT.authorizedMerchants(merchant.address);
            
            if (!isAuthorized) {
                console.log("Authorizing merchant...");
                const authTx = await wavexNFT.authorizeMerchant(
                    merchant.address,
                    gasSettings
                );
                await authTx.wait();
                console.log("Merchant authorized successfully");
            } else {
                console.log("Merchant already authorized");
            }

            // Process cashiers if provided
            if (merchant.cashiers && merchant.cashiers.length > 0) {
                console.log("\nProcessing cashiers...");
                
                for (const cashierAddress of merchant.cashiers) {
                    if (!cashierAddress) continue;

                    const isCashier = await wavexNFT.authorizedMerchants(cashierAddress);
                    
                    if (!isCashier) {
                        console.log(`Authorizing cashier: ${cashierAddress}`);
                        const cashierTx = await wavexNFT.authorizeMerchant(
                            cashierAddress,
                            gasSettings
                        );
                        await cashierTx.wait();
                        console.log("Cashier authorized successfully");
                    } else {
                        console.log(`Cashier already authorized: ${cashierAddress}`);
                    }
                }
            }
        }

        // Verify final setup
        console.log("\nVerifying merchant setup...");
        
        const setupResults = [];
        for (const merchant of merchants) {
            const merchantStatus = await wavexNFT.authorizedMerchants(merchant.address);
            
            const cashierStatuses = [];
            if (merchant.cashiers) {
                for (const cashier of merchant.cashiers) {
                    if (cashier) {
                        const status = await wavexNFT.authorizedMerchants(cashier);
                        cashierStatuses.push({ address: cashier, authorized: status });
                    }
                }
            }

            setupResults.push({
                name: merchant.name,
                address: merchant.address,
                authorized: merchantStatus,
                cashiers: cashierStatuses
            });
        }

        console.log("\nSetup Summary:");
        console.log("==============");
        setupResults.forEach(result => {
            console.log(`\nMerchant: ${result.name}`);
            console.log(`Address: ${result.address}`);
            console.log(`Authorized: ${result.authorized}`);
            if (result.cashiers.length > 0) {
                console.log("Cashiers:");
                result.cashiers.forEach(cashier => {
                    console.log(`- ${cashier.address}: ${cashier.authorized}`);
                });
            }
        });

        return {
            successful: true,
            merchants: setupResults
        };

    } catch (error) {
        console.error("\nError in merchant setup:", error);
        process.exit(1);
    }
}

// Execute if script is run directly
if (require.main === module) {
    setupMerchants()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = setupMerchants;