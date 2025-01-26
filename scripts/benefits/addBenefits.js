// scripts/benefits/addBenefits.js
const hre = require("hardhat");
const path = require('path');
const fs = require('fs');
require('dotenv').config();  // Explicitly load .env file
const { BenefitType, validateBenefitParams } = require('../utils/benefitTypes');

async function getDeployment(networkName) {
    const deploymentPath = path.join(__dirname, '../../deployments', `${networkName}_deployment.json`);
    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`No deployment found for network ${networkName}`);
    }
    return JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
}

async function addBenefit(contract, tokenId, benefitType, value, durationInDays) {
    try {
        // Validate benefit parameters
        validateBenefitParams(benefitType, value, durationInDays);

        console.log(`\nAdding benefit to Token ID: ${tokenId}`);
        console.log("Benefit Details:");
        console.log("================");
        console.log(`Type: ${Object.keys(BenefitType)[benefitType]}`);
        console.log(`Value: ${value}`);
        console.log(`Duration: ${durationInDays} days`);

        // Add benefit
        const tx = await contract.addBenefit(tokenId, benefitType, value, durationInDays);
        console.log("\nTransaction submitted. Waiting for confirmation...");
        
        const receipt = await tx.wait();
        
        // Find the BenefitAdded event
        const event = receipt.logs.find(log => {
            try {
                return contract.interface.parseLog(log).name === "BenefitAdded";
            } catch {
                return false;
            }
        });

        if (event) {
            const parsedEvent = contract.interface.parseLog(event);
            console.log("\nBenefit added successfully!");
            console.log(`Transaction Hash: ${receipt.hash}`);
            console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
            
            return {
                success: true,
                tokenId: parsedEvent.args.tokenId.toString(),
                benefitType: parsedEvent.args.benefitType,
                value: parsedEvent.args.value.toString(),
                transactionHash: receipt.hash
            };
        }

    } catch (error) {
        console.error(`\nError adding benefit to token ${tokenId}:`, error.message);
        throw error;
    }
}

async function main() {
    try {
        // Debug: Print environment variables
        console.log("\nEnvironment Variables:");
        console.log("=====================");
        console.log("TOKEN_ID:", process.env.TOKEN_ID);
        console.log("BENEFIT_TYPE:", process.env.BENEFIT_TYPE);
        console.log("BENEFIT_VALUE:", process.env.BENEFIT_VALUE);
        console.log("BENEFIT_DURATION:", process.env.BENEFIT_DURATION);

        // Get deployment information
        const networkName = hre.network.name;
        const deployment = await getDeployment(networkName);
        
        // Get contract instance
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const wavexNFT = WaveXNFT.attach(deployment.contractAddress);

        // Get parameters with defaults
        const tokenId = process.env.TOKEN_ID || 1;
        const benefitType = process.env.BENEFIT_TYPE || 0;
        const value = process.env.BENEFIT_VALUE || 1000;
        const duration = process.env.BENEFIT_DURATION || 30;

        console.log("\nUsing Values:");
        console.log("=============");
        console.log("Token ID:", tokenId);
        console.log("Benefit Type:", benefitType);
        console.log("Value:", value);
        console.log("Duration:", duration);

        // Add the benefit
        const result = await addBenefit(
            wavexNFT,
            parseInt(tokenId),
            parseInt(benefitType),
            parseInt(value),
            parseInt(duration)
        );

        // Get updated benefits for the token
        const benefits = await wavexNFT.getBenefits(tokenId);
        
        console.log("\nUpdated Benefits for Token:", tokenId);
        console.log("==============================");
        benefits.forEach((benefit, index) => {
            console.log(`\nBenefit #${index + 1}:`);
            console.log(`Type: ${Object.keys(BenefitType)[benefit.benefitType]}`);
            console.log(`Value: ${benefit.value.toString()}`);
            console.log(`Expiration: ${new Date(Number(benefit.expirationTime) * 1000).toLocaleString()}`);
            console.log(`Redeemed: ${benefit.isRedeemed}`);
        });

        return result;

    } catch (error) {
        console.error("\nDetailed error information:");
        console.error("===========================");
        console.error(error);
        process.exit(1);
    }
}

// Execute if called directly
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;