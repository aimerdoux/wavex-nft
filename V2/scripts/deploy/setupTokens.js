// scripts/deploy/setupTokens.js
const hre = require("hardhat");
require('dotenv').config();

async function setupTokens() {
    try {
        console.log("Starting WaveX V2 token setup...");

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
            gasLimit: 100000 // Lower gas limit for token operations
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

            console.log(`\nProcessing ${symbol} token (${address})...`);
            
            try {
                const isSupported = await wavexNFT.supportedTokens(address);
                if (!isSupported) {
                    console.log(`Adding ${symbol} token...`);
                    const tx = await wavexNFT.addSupportedToken(address, gasSettings);
                    console.log(`Transaction sent: ${tx.hash}`);
                    console.log('Waiting for confirmation...');
                    await tx.wait();
                    console.log(`${symbol} token added successfully`);
                } else {
                    console.log(`${symbol} token already supported`);
                }
            } catch (error) {
                console.error(`Error processing ${symbol} token:`, error.message);
                throw error;
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
        console.error("\nError in token setup:");
        console.error('- Message:', error.message);
        console.error('- Stack:', error.stack);
        if (error.code) console.error('- Code:', error.code);
        if (error.reason) console.error('- Reason:', error.reason);
        if (error.data) console.error('- Data:', error.data);
        throw error;
    }
}

// Export the function
module.exports = setupTokens;

// Run setup if called directly
if (require.main === module) {
    setupTokens()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}