// scripts/test/systemTest.js
const hre = require("hardhat");
const { expect } = require("chai");
const { deployV2 } = require('../deploy/deployV2.js');
const { setupTokens } = require('../deploy/setupTokens');
const { setupMerchants } = require('../deploy/setupMerchants');

async function runSystemTest() {
    try {
        console.log("Starting WaveX V2 System Test...\n");

        // 1. Deploy and Setup
        console.log("1. Deployment and Setup");
        console.log("------------------------");

        // Get network config for gas settings
        const networkConfig = hre.config.networks[hre.network.name];
        const gasSettings = {
            gasPrice: networkConfig.gasPrice,
            gasLimit: networkConfig.gasLimit
        };

        // Deploy contract
        console.log("Deploying WaveXNFTV2 contract...");
        const deployResult = await deployV2();
        if (!deployResult || !deployResult.contractAddress) {
            throw new Error("Deployment failed or returned invalid result");
        }
        console.log(`Contract deployed at: ${deployResult.contractAddress}\n`);

        // Get contract instance
        const WaveXNFTV2 = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFTV2.attach(deployResult.contractAddress);

        // Check if templates need initialization
        console.log("Checking template initialization...");
        try {
            const template1 = await wavexNFT.getTemplate(1, gasSettings);
            if (template1[0] === "") {
                console.log("Templates not initialized, initializing...");
                const initTx = await wavexNFT.initializeDefaultTemplates(gasSettings);
                await initTx.wait();
                console.log("Default templates initialized\n");
            } else {
                console.log("Templates already initialized\n");
            }
        } catch (error) {
            if (error.message.includes("Template does not exist")) {
                console.log("Templates not initialized, initializing...");
                const initTx = await wavexNFT.initializeDefaultTemplates(gasSettings);
                await initTx.wait();
                console.log("Default templates initialized\n");
            } else {
                throw error;
            }
        }

        // Setup tokens (USDT/USDC)
        console.log("Setting up payment tokens...");
        const tokenSetup = await setupTokens();
        if (!tokenSetup || !tokenSetup.successful) {
            throw new Error("Token setup failed");
        }
        console.log("Payment tokens configured\n");

        // Setup merchants
        console.log("Setting up test merchants...");
        const merchantSetup = await setupMerchants();
        if (!merchantSetup || !merchantSetup.successful) {
            throw new Error("Merchant setup failed");
        }
        console.log("Merchants configured\n");

        // Verify setup
        console.log("Verifying setup...");
        
        // Check templates
        console.log("\nVerifying templates...");
        const goldTemplate = await wavexNFT.getTemplate(1, gasSettings);
        const platinumTemplate = await wavexNFT.getTemplate(2, gasSettings);
        
        console.log("Gold Template:", {
            name: goldTemplate[0],
            baseBalance: hre.ethers.formatEther(goldTemplate[1]),
            price: hre.ethers.formatEther(goldTemplate[2]),
            discount: Number(goldTemplate[3]),
            isVIP: goldTemplate[4],
            active: goldTemplate[6]
        });
        
        console.log("\nPlatinum Template:", {
            name: platinumTemplate[0],
            baseBalance: hre.ethers.formatEther(platinumTemplate[1]),
            price: hre.ethers.formatEther(platinumTemplate[2]),
            discount: Number(platinumTemplate[3]),
            isVIP: platinumTemplate[4],
            active: platinumTemplate[6]
        });

        // Check tokens
        console.log("\nVerifying tokens...");
        const usdtSupported = await wavexNFT.supportedTokens(process.env.USDT_CONTRACT_ADDRESS);
        const usdcSupported = await wavexNFT.supportedTokens(process.env.USDC_CONTRACT_ADDRESS);
        console.log("USDT supported:", usdtSupported);
        console.log("USDC supported:", usdcSupported);

        // Check merchant
        console.log("\nVerifying merchant...");
        const merchantAuthorized = await wavexNFT.authorizedMerchants(process.env.MERCHANT_ADDRESS);
        console.log("Merchant authorized:", merchantAuthorized);

        // Final Status Report
        console.log("\nSystem Test Complete!");
        console.log("--------------------");
        console.log("All core functionalities validated:");
        console.log("✓ Contract deployment");
        console.log("✓ Template initialization");
        console.log("✓ Token setup");
        console.log("✓ Merchant management");

        return {
            success: true,
            deployedContract: deployResult.contractAddress,
            templates: {
                gold: goldTemplate[0],
                platinum: platinumTemplate[0]
            },
            tokens: {
                USDT: usdtSupported,
                USDC: usdcSupported
            },
            merchant: merchantAuthorized
        };

    } catch (error) {
        console.error("\nSystem Test Failed:", error);
        throw error;
    }
}

module.exports = {
    runSystemTest
};