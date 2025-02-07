// scripts/deploy/setupTokens.js
const hre = require("hardhat");
require('dotenv').config({ path: 'V2.env' });

async function setupTokens() {
    try {
        console.log("Starting WaveX V2 token setup...");

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

        console.log("\nSetting up supported tokens...");
        
        const tokens = {
            USDT: process.env.USDT_CONTRACT_ADDRESS,
            USDC: process.env.USDC_CONTRACT_ADDRESS
        };

        for (const [symbol, address] of Object.entries(tokens)) {
            if (!address) {
                throw new Error(`${symbol}_CONTRACT_ADDRESS not found in environment`);
            }

            const isSupported = await wavexNFT.supportedTokens(address);
            if (!isSupported) {
                console.log(`Adding ${symbol} token (${address})...`);
                const tx = await wavexNFT.addSupportedToken(address, gasSettings);
                await tx.wait();
                console.log(`${symbol} token added successfully`);
            } else {
                console.log(`${symbol} token already supported`);
            }
        }

        // Verify final setup
        console.log("\nVerifying token setup...");
        const setupResults = {};
        for (const [symbol, address] of Object.entries(tokens)) {
            const isSupported = await wavexNFT.supportedTokens(address);
            setupResults[symbol] = {
                address,
                supported: isSupported
            };
        }

        console.log("\nSetup Summary:");
        console.log("==============");
        for (const [symbol, result] of Object.entries(setupResults)) {
            console.log(`\n${symbol} Configuration:`);
            console.log(`Address: ${result.address}`);
            console.log(`Status: ${result.supported ? '✅ Supported' : '❌ Not Supported'}`);
        }

        return { successful: true, tokens: setupResults };

    } catch (error) {
        console.error("\nError in token setup:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    setupTokens()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = setupTokens;