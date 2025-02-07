// scripts/merchant/manageMerchants.js
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'V2.env' });

async function manageMerchants(action, merchantData) {
    try {
        console.log(`Starting merchant ${action} process...`);

        // Get contract instance
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

        switch (action.toLowerCase()) {
            case 'add':
                for (const merchant of merchantData) {
                    console.log(`\nProcessing merchant: ${merchant.name || 'Unnamed'}`);
                    console.log(`Address: ${merchant.address}`);

                    const isAuthorized = await wavexNFT.authorizedMerchants(merchant.address);
                    if (!isAuthorized) {
                        console.log("Authorizing merchant...");
                        const tx = await wavexNFT.authorizeMerchant(
                            merchant.address,
                            gasSettings
                        );
                        await tx.wait();
                        console.log("✅ Merchant authorized successfully");
                    } else {
                        console.log("⚠️ Merchant already authorized");
                    }
                }
                break;

            case 'remove':
                for (const merchant of merchantData) {
                    console.log(`\nProcessing merchant: ${merchant.name || 'Unnamed'}`);
                    console.log(`Address: ${merchant.address}`);

                    const isAuthorized = await wavexNFT.authorizedMerchants(merchant.address);
                    if (isAuthorized) {
                        console.log("Revoking merchant...");
                        const tx = await wavexNFT.revokeMerchant(
                            merchant.address,
                            gasSettings
                        );
                        await tx.wait();
                        console.log("✅ Merchant revoked successfully");
                    } else {
                        console.log("⚠️ Merchant not authorized");
                    }
                }
                break;

            case 'check':
                console.log("\nChecking merchant status:");
                for (const merchant of merchantData) {
                    const isAuthorized = await wavexNFT.authorizedMerchants(merchant.address);
                    console.log(`\nMerchant: ${merchant.name || 'Unnamed'}`);
                    console.log(`Address: ${merchant.address}`);
                    console.log(`Status: ${isAuthorized ? '✅ Authorized' : '❌ Not Authorized'}`);
                }
                break;

            default:
                throw new Error(`Invalid action: ${action}`);
        }

    } catch (error) {
        console.error("\nError in merchant management:", error);
        process.exit(1);
    }
}

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const action = args[0];
    const merchantsFile = args[1];

    if (!action || !merchantsFile) {
        console.log("\nUsage:");
        console.log("npx hardhat run scripts/merchant/manageMerchants.js [action] [merchants-file.json] --network [network]");
        console.log("\nActions:");
        console.log("  add    - Add new merchants");
        console.log("  remove - Remove existing merchants");
        console.log("  check  - Check merchant status");
        console.log("\nExample merchants.json:");
        console.log(JSON.stringify([
            {
                "name": "Merchant 1",
                "address": "0x..."
            }
        ], null, 2));
        process.exit(1);
    }

    // Read merchants from file
    const merchantData = JSON.parse(fs.readFileSync(merchantsFile, 'utf8'));

    manageMerchants(action, merchantData)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = manageMerchants;