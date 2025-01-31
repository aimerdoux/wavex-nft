const hre = require("hardhat");
require('dotenv').config();

async function getBenefitDetails(contract, tokenId, benefitIndex) {
    const benefits = await contract.getBenefits(tokenId);
    if (benefitIndex >= benefits.length) {
        throw new Error(`Benefit index ${benefitIndex} does not exist for token ${tokenId}`);
    }
    return benefits[benefitIndex];
}

async function modifyBenefit(contract, tokenId, benefitIndex, newValue, newDuration) {
    try {
        // Get current benefit details
        const currentBenefit = await getBenefitDetails(contract, tokenId, benefitIndex);
        
        console.log("\nCurrent Benefit Details:");
        console.log("=======================");
        console.log(`Type: ${currentBenefit.benefitType}`);
        console.log(`Current Value: ${currentBenefit.value.toString()}`);
        console.log(`Current Expiration: ${new Date(Number(currentBenefit.expirationTime) * 1000).toLocaleString()}`);
        console.log(`Is Redeemed: ${currentBenefit.isRedeemed}`);

        if (currentBenefit.isRedeemed) {
            throw new Error("Cannot modify a redeemed benefit");
        }

        console.log("\nModifying benefit with new values:");
        console.log("=================================");
        console.log(`New Value: ${newValue}`);
        console.log(`New Duration: ${newDuration} days`);

        // Configure gas settings for Polygon Amoy
        const gasSettings = {
            maxFeePerGas: hre.ethers.parseUnits("50", "gwei"),
            maxPriorityFeePerGas: hre.ethers.parseUnits("25", "gwei"),
            gasLimit: 500000
        };

        // Call the new updateBenefit method
        const tx = await contract.updateBenefit(
            tokenId,
            benefitIndex,
            newValue,
            newDuration,
            gasSettings
        );

        console.log("\nTransaction submitted. Waiting for confirmation...");
        const receipt = await tx.wait();

        // Get updated benefits
        const updatedBenefitsAfter = await contract.getBenefits(tokenId);
        const updatedBenefit = updatedBenefitsAfter[benefitIndex];

        console.log("\nBenefit Modified Successfully!");
        console.log("=============================");
        console.log(`Transaction Hash: ${receipt.hash}`);
        console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
        
        console.log("\nUpdated Benefit Details:");
        console.log(`Value: ${updatedBenefit.value.toString()}`);
        console.log(`New Expiration: ${new Date(Number(updatedBenefit.expirationTime) * 1000).toLocaleString()}`);

        return {
            success: true,
            transactionHash: receipt.hash,
            tokenId: tokenId,
            benefitIndex: benefitIndex,
            newValue: updatedBenefit.value.toString(),
            newExpiration: updatedBenefit.expirationTime.toString()
        };

    } catch (error) {
        console.error(`\nError modifying benefit:`, error.message);
        throw error;
    }
}

async function main() {
    try {
        // Get parameters from environment variables with proper prefixes
        const requiredEnvVars = {
            CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
            MODIFY_BENEFIT_TOKEN_ID: process.env.MODIFY_BENEFIT_TOKEN_ID,
            MODIFY_BENEFIT_INDEX: process.env.MODIFY_BENEFIT_INDEX,
            NEW_VALUE: process.env.NEW_VALUE,
            NEW_DURATION: process.env.NEW_DURATION
        };

        // Validate all required environment variables
        const missingVars = Object.entries(requiredEnvVars)
            .filter(([key, value]) => !value)
            .map(([key]) => key);

        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }

        // Debug: Print environment variables
        console.log("\nEnvironment Variables:");
        console.log("=====================");
        Object.entries(requiredEnvVars).forEach(([key, value]) => {
            console.log(`${key}:`, value);
        });

        // Get contract instance
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const contract = WaveXNFT.attach(requiredEnvVars.CONTRACT_ADDRESS);

        // Modify the benefit
        const result = await modifyBenefit(
            contract,
            parseInt(requiredEnvVars.MODIFY_BENEFIT_TOKEN_ID),
            parseInt(requiredEnvVars.MODIFY_BENEFIT_INDEX),
            parseInt(requiredEnvVars.NEW_VALUE),
            parseInt(requiredEnvVars.NEW_DURATION)
        );

        // Get all benefits for the token after modification
        const benefits = await contract.getBenefits(requiredEnvVars.MODIFY_BENEFIT_TOKEN_ID);
        
        console.log("\nAll Benefits for Token:", requiredEnvVars.MODIFY_BENEFIT_TOKEN_ID);
        console.log("=========================");
        benefits.forEach((benefit, index) => {
            console.log(`\nBenefit #${index}:`);
            console.log(`Type: ${benefit.benefitType}`);
            console.log(`Value: ${benefit.value.toString()}`);
            console.log(`Expiration: ${new Date(Number(benefit.expirationTime) * 1000).toLocaleString()}`);
            console.log(`Redeemed: ${benefit.isRedeemed}`);
        });

        return result;

    } catch (error) {
        console.error("\nDetailed error information:");
        console.error("===========================");
        console.error(error);
        console.error("\nPlease make sure your .env file includes:");
        console.error("CONTRACT_ADDRESS=0x...");
        console.error("MODIFY_BENEFIT_TOKEN_ID=3");
        console.error("MODIFY_BENEFIT_INDEX=0");
        console.error("NEW_VALUE=2000");
        console.error("NEW_DURATION=120");
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

module.exports = main;