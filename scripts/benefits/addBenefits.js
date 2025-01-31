// scripts/benefits/addBenefits.js
const hre = require("hardhat");
require('dotenv').config();

async function main() {
    try {
        // Get parameters from environment variables
        const tokenId = process.env.SINGLE_BENEFIT_TOKEN_ID;
        const benefitType = process.env.SINGLE_BENEFIT_TYPE;
        const value = process.env.SINGLE_BENEFIT_VALUE;
        const duration = process.env.SINGLE_BENEFIT_DURATION;
        const contractAddress = process.env.CONTRACT_ADDRESS;

        // Debug: Print environment variables
        console.log("\nEnvironment Variables:");
        console.log("=====================");
        console.log("TOKEN_ID:", tokenId);
        console.log("BENEFIT_TYPE:", benefitType);
        console.log("BENEFIT_VALUE:", value);
        console.log("BENEFIT_DURATION:", duration);
        console.log("CONTRACT_ADDRESS:", contractAddress);

        if (!contractAddress) {
            throw new Error("CONTRACT_ADDRESS not found in environment variables");
        }

        // Validate parameters
        if (!tokenId || !benefitType || !value || !duration) {
            throw new Error("Missing benefit parameters. Please check your .env file");
        }

        // Get contract instance
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const contract = WaveXNFT.attach(contractAddress);

        console.log(`\nAdding benefit to Token ID: ${tokenId}`);
        console.log("Benefit Details:");
        console.log("================");
        console.log(`Type: ${benefitType}`);
        console.log(`Value: ${value}`);
        console.log(`Duration: ${duration} days`);

        // Configure gas settings for Polygon Amoy
        const gasSettings = {
            maxFeePerGas: hre.ethers.parseUnits("50", "gwei"),
            maxPriorityFeePerGas: hre.ethers.parseUnits("25", "gwei"),
            gasLimit: 500000
        };

        // Add benefit
        const tx = await contract.addBenefit(
            tokenId,
            benefitType,
            value,
            duration,
            gasSettings
        );

        console.log("\nTransaction submitted. Waiting for confirmation...");
        const receipt = await tx.wait();

        console.log("\nBenefit added successfully!");
        console.log("Transaction Hash:", receipt.hash);
        console.log("Gas Used:", receipt.gasUsed.toString());

        // Get updated benefits for the token
        const benefits = await contract.getBenefits(tokenId);
        
        console.log("\nUpdated Benefits for Token:", tokenId);
        console.log("==============================");
        benefits.forEach((benefit, index) => {
            console.log(`\nBenefit #${index + 1}:`);
            console.log(`Type: ${benefit.benefitType}`);
            console.log(`Value: ${benefit.value.toString()}`);
            console.log(`Expiration: ${new Date(Number(benefit.expirationTime) * 1000).toLocaleString()}`);
            console.log(`Redeemed: ${benefit.isRedeemed}`);
        });

    } catch (error) {
        console.error("\nError during benefit addition:");
        console.error(error);
        process.exit(1);
    }
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}