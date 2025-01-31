// scripts/benefits/redeemBenefit.js
const hre = require("hardhat");
require('dotenv').config();

async function checkBenefitValidity(contract, tokenId, benefitIndex) {
    try {
        const benefits = await contract.getBenefits(tokenId);
        if (benefitIndex >= benefits.length) {
            throw new Error(`Benefit index ${benefitIndex} does not exist for token ${tokenId}`);
        }

        const benefit = benefits[benefitIndex];
        console.log("\nBenefit Details Pre-Redemption:");
        console.log("==============================");
        console.log(`Type: ${benefit.benefitType}`);
        console.log(`Available Value: ${benefit.value.toString()}`);
        console.log(`Remaining Value: ${benefit.remainingValue.toString()}`);
        console.log(`Expiration: ${new Date(Number(benefit.expirationTime) * 1000).toLocaleString()}`);
        console.log(`Already Redeemed: ${benefit.isRedeemed}`);

        // Check expiration
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime > Number(benefit.expirationTime)) {
            throw new Error("Benefit has expired");
        }

        return benefit;
    } catch (error) {
        console.error("Error checking benefit validity:", error.message);
        throw error;
    }
}

async function redeemBenefit(contract, tokenId, benefitIndex, redeemAmount) {
    try {
        // First check if merchant is authorized
        const [signer] = await hre.ethers.getSigners();
        const isAuthorized = await contract.authorizedMerchants(signer.address);
        
        console.log("\nMerchant Authorization Check:");
        console.log("============================");
        console.log("Merchant Address:", signer.address);
        console.log("Is Authorized:", isAuthorized);

        if (!isAuthorized) {
            throw new Error("Not an authorized merchant");
        }

        // Check benefit validity
        const benefit = await checkBenefitValidity(contract, tokenId, benefitIndex);

        // Validate redemption amount
        if (redeemAmount > benefit.remainingValue) {
            throw new Error(`Insufficient balance. Available: ${benefit.remainingValue}, Requested: ${redeemAmount}`);
        }

        console.log("\nProcessing Redemption:");
        console.log("=====================");
        console.log(`Token ID: ${tokenId}`);
        console.log(`Benefit Index: ${benefitIndex}`);
        console.log(`Redemption Amount: ${redeemAmount}`);

        // Configure gas settings for Polygon Amoy
        const gasSettings = {
            maxFeePerGas: hre.ethers.parseUnits("50", "gwei"),
            maxPriorityFeePerGas: hre.ethers.parseUnits("25", "gwei"),
            gasLimit: 500000
        };

        // Execute redemption
        const tx = await contract.redeemBenefit(tokenId, benefitIndex, redeemAmount, gasSettings);
        console.log("\nTransaction submitted. Waiting for confirmation...");
        
        const receipt = await tx.wait();

        // Get updated benefit details
        const updatedBenefit = (await contract.getBenefits(tokenId))[benefitIndex];

        console.log("\nRedemption Completed Successfully!");
        console.log("================================");
        console.log("Transaction Hash:", receipt.hash);
        console.log("Gas Used:", receipt.gasUsed.toString());
        console.log("\nUpdated Benefit Status:");
        console.log("Remaining Value:", updatedBenefit.remainingValue.toString());
        console.log("Is Fully Redeemed:", updatedBenefit.isRedeemed);

        // Show all benefits after redemption
        const allBenefits = await contract.getBenefits(tokenId);
        console.log("\nAll Benefits for Token:", tokenId);
        console.log("=========================");
        allBenefits.forEach((benefit, index) => {
            console.log(`\nBenefit #${index}:`);
            console.log(`Type: ${benefit.benefitType}`);
            console.log(`Value: ${benefit.value.toString()}`);
            console.log(`Remaining Value: ${benefit.remainingValue.toString()}`);
            console.log(`Expiration: ${new Date(Number(benefit.expirationTime) * 1000).toLocaleString()}`);
            console.log(`Redeemed: ${benefit.isRedeemed}`);
        });

        return {
            success: true,
            transactionHash: receipt.hash,
            remainingValue: updatedBenefit.remainingValue.toString(),
            isRedeemed: updatedBenefit.isRedeemed
        };

    } catch (error) {
        console.error("\nError during redemption:", error.message);
        throw error;
    }
}

async function main() {
    try {
        const contractAddress = process.env.CONTRACT_ADDRESS;
        const tokenId = process.env.REDEEM_TOKEN_ID;
        const benefitIndex = process.env.REDEEM_BENEFIT_INDEX || "0";
        const redeemAmount = process.env.REDEEM_AMOUNT;

        // Debug: Print environment variables
        console.log("\nEnvironment Variables:");
        console.log("=====================");
        console.log("CONTRACT_ADDRESS:", contractAddress);
        console.log("TOKEN_ID:", tokenId);
        console.log("BENEFIT_INDEX:", benefitIndex);
        console.log("REDEEM_AMOUNT:", redeemAmount);

        if (!contractAddress) {
            throw new Error("CONTRACT_ADDRESS not found in environment variables");
        }

        if (!tokenId || !redeemAmount) {
            throw new Error("Please provide TOKEN_ID and REDEEM_AMOUNT in environment variables");
        }

        // Get contract instance
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const contract = WaveXNFT.attach(contractAddress);

        // Process redemption
        const result = await redeemBenefit(
            contract,
            parseInt(tokenId),
            parseInt(benefitIndex),
            parseInt(redeemAmount)
        );

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