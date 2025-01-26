// scripts/benefits/redeemBenefit.js
const hre = require("hardhat");
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { BenefitType, validateBenefitParams } = require('../utils/benefitTypes');

async function getDeployment(networkName) {
    const deploymentPath = path.join(__dirname, '../../deployments', `${networkName}_deployment.json`);
    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`No deployment found for network ${networkName}`);
    }
    return JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
}

async function checkBenefitValidity(contract, tokenId, benefitIndex) {
    try {
        const benefits = await contract.getBenefits(tokenId);
        if (benefitIndex >= benefits.length) {
            throw new Error(`Benefit index ${benefitIndex} does not exist for token ${tokenId}`);
        }

        const benefit = benefits[benefitIndex];
        console.log("\nBenefit Details Pre-Redemption:");
        console.log("==============================");
        console.log(`Type: ${Object.keys(BenefitType)[benefit.benefitType]}`);
        console.log(`Available Value: ${benefit.value.toString()}`);
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
        if (redeemAmount > benefit.value) {
            throw new Error(`Insufficient balance. Available: ${benefit.value}, Requested: ${redeemAmount}`);
        }

        console.log("\nProcessing Redemption:");
        console.log("=====================");
        console.log(`Token ID: ${tokenId}`);
        console.log(`Benefit Index: ${benefitIndex}`);
        console.log(`Redemption Amount: ${redeemAmount}`);

        // Execute redemption
        const tx = await contract.redeemBenefit(tokenId, benefitIndex, redeemAmount);
        console.log("\nTransaction submitted. Waiting for confirmation...");
        
        const receipt = await tx.wait();

        // Find redemption event
        const event = receipt.logs.find(log => {
            try {
                return contract.interface.parseLog(log).name === "BenefitRedeemed";
            } catch {
                return false;
            }
        });

        // Get updated benefit details
        const updatedBenefit = (await contract.getBenefits(tokenId))[benefitIndex];

        console.log("\nRedemption Completed Successfully!");
        console.log("================================");
        console.log("Transaction Hash:", receipt.hash);
        console.log("Gas Used:", receipt.gasUsed.toString());
        console.log("\nUpdated Benefit Status:");
        console.log("Remaining Value:", updatedBenefit.value.toString());
        console.log("Is Fully Redeemed:", updatedBenefit.isRedeemed);

        return {
            success: true,
            transactionHash: receipt.hash,
            remainingValue: updatedBenefit.value.toString(),
            isRedeemed: updatedBenefit.isRedeemed
        };

    } catch (error) {
        console.error("\nError during redemption:", error.message);
        throw error;
    }
}

async function main() {
    try {
        // Debug: Print environment variables
        console.log("\nEnvironment Variables:");
        console.log("=====================");
        console.log("TOKEN_ID:", process.env.TOKEN_ID);
        console.log("BENEFIT_INDEX:", process.env.BENEFIT_INDEX);
        console.log("REDEEM_AMOUNT:", process.env.REDEEM_AMOUNT);

        const networkName = hre.network.name;
        const deployment = await getDeployment(networkName);
        
        // Get contract instance
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const wavexNFT = WaveXNFT.attach(deployment.contractAddress);

        // Get parameters with validation
        const tokenId = process.env.TOKEN_ID;
        const benefitIndex = process.env.BENEFIT_INDEX || 0;
        const redeemAmount = process.env.REDEEM_AMOUNT;

        if (!tokenId || !redeemAmount) {
            throw new Error(
                "Please provide TOKEN_ID and REDEEM_AMOUNT in environment variables"
            );
        }

        // Process redemption
        const result = await redeemBenefit(
            wavexNFT,
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