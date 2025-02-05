const hre = require("hardhat");
require('dotenv').config({ path: 'V2.env' });

// Token configurations for Polygon Amoy testnet
const SUPPORTED_TOKENS = {
    USDT: {
        symbol: "USDT",
        address: process.env.USDT_CONTRACT_ADDRESS
    },
    USDC: {
        symbol: "USDC",
        address: process.env.USDC_CONTRACT_ADDRESS
    }
};

async function setupTokens() {
    try {
        console.log("Starting WaveX V2 token setup...");

        // Get the WaveX NFT contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        if (!contractAddress) {
            throw new Error("WAVEX_NFT_V2_ADDRESS not found in environment variables");
        }

        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        console.log("\nSetting up supported tokens...");
        
        // Setup USDT
        if (!SUPPORTED_TOKENS.USDT.address) {
            throw new Error("USDT_CONTRACT_ADDRESS not found in environment variables");
        }
        
        console.log(`Adding USDT token (${SUPPORTED_TOKENS.USDT.address})...`);
        const usdtTx = await wavexNFT.addSupportedToken(
            SUPPORTED_TOKENS.USDT.address,
            { 
                gasLimit: process.env.GAS_LIMIT || 5000000,
                gasPrice: process.env.GAS_PRICE || 35000000000
            }
        );
        await usdtTx.wait();
        console.log("USDT token added successfully");

        // Setup USDC
        if (!SUPPORTED_TOKENS.USDC.address) {
            throw new Error("USDC_CONTRACT_ADDRESS not found in environment variables");
        }

        console.log(`Adding USDC token (${SUPPORTED_TOKENS.USDC.address})...`);
        const usdcTx = await wavexNFT.addSupportedToken(
            SUPPORTED_TOKENS.USDC.address,
            { 
                gasLimit: process.env.GAS_LIMIT || 5000000,
                gasPrice: process.env.GAS_PRICE || 35000000000
            }
        );
        await usdcTx.wait();
        console.log("USDC token added successfully");

        // Verify setup
        console.log("\nVerifying token setup...");
        
        const isUSDTSupported = await wavexNFT.supportedTokens(SUPPORTED_TOKENS.USDT.address);
        const isUSDCSupported = await wavexNFT.supportedTokens(SUPPORTED_TOKENS.USDC.address);

        console.log("\nSetup Summary:");
        console.log("==============");
        console.log("USDT Configuration:");
        console.log(`- Address: ${SUPPORTED_TOKENS.USDT.address}`);
        console.log(`- Supported: ${isUSDTSupported}`);
        
        console.log("\nUSDC Configuration:");
        console.log(`- Address: ${SUPPORTED_TOKENS.USDC.address}`);
        console.log(`- Supported: ${isUSDCSupported}`);

        if (!isUSDTSupported || !isUSDCSupported) {
            throw new Error("Token setup verification failed");
        }

        return {
            successful: true,
            tokens: {
                USDT: {
                    address: SUPPORTED_TOKENS.USDT.address,
                    supported: isUSDTSupported
                },
                USDC: {
                    address: SUPPORTED_TOKENS.USDC.address,
                    supported: isUSDCSupported
                }
            }
        };

    } catch (error) {
        console.error("\nError in token setup:", error);
        process.exit(1);
    }
}

// Execute if script is run directly
if (require.main === module) {
    setupTokens()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = setupTokens;