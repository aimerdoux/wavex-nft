// scripts/benefits/modifyBenefits.js
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

        // Call contract method to modify benefit
        const tx = await contract.addBenefit(
            tokenId,
            currentBenefit.benefitType,
            newValue,
            newDuration,
            gasSettings
        );

        console.log("\nTransaction submitted. Waiting for confirmation...");
        const receipt = await tx.wait();

        // Get updated benefit details
        const updatedBenefit = await getBenefitDetails(contract, tokenId, benefitIndex);

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
        const contractAddress = process.env.CONTRACT_ADDRESS;
        const tokenId = process.env.TOKEN_ID;
        const benefitIndex = process.env.BENEFIT_INDEX || "0";
        const newValue = process.env.NEW_VALUE;
        const newDuration = process.env.NEW_DURATION;

        // Debug: Print environment variables
        console.log("\nEnvironment Variables:");
        console.log("=====================");
        console.log("CONTRACT_ADDRESS:", contractAddress);
        console.log("TOKEN_ID:", tokenId);
        console.log("BENEFIT_INDEX:", benefitIndex);
        console.log("NEW_VALUE:", newValue);
        console.log("NEW_DURATION:", newDuration);

        if (!contractAddress) {
            throw new Error("CONTRACT_ADDRESS not found in environment variables");
        }

        if (!tokenId || !newValue || !newDuration) {
            throw new Error("Please provide TOKEN_ID, NEW_VALUE, and NEW_DURATION in environment variables");
        }

        // Get contract instance
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const contract = WaveXNFT.attach(contractAddress);

        // Modify the benefit
        const result = await modifyBenefit(
            contract,
            parseInt(tokenId),
            parseInt(benefitIndex),
            parseInt(newValue),
            parseInt(newDuration)
        );

        // Get all benefits for the token after modification
        const benefits = await contract.getBenefits(tokenId);
        
        console.log("\nAll Benefits for Token:", tokenId);
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