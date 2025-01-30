// scripts/merchant/authorizeMerchant.js
const hre = require("hardhat");
require('dotenv').config();

async function main() {
    try {
        // Get parameters from environment
        const contractAddress = process.env.CONTRACT_ADDRESS;
        
        // Get contract instance
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const contract = WaveXNFT.attach(contractAddress);

        // Get current signer to authorize as merchant
        const [owner] = await hre.ethers.getSigners();
        const merchantAddress = process.env.MERCHANT_ADDRESS || owner.address;

        console.log("\nAuthorization Details:");
        console.log("=====================");
        console.log("Contract Address:", contractAddress);
        console.log("Owner Address:", owner.address);
        console.log("Merchant Address:", merchantAddress);

        // Check current status
        const currentStatus = await contract.authorizedMerchants(merchantAddress);
        console.log("\nCurrent Authorization Status:", currentStatus);

        if (!currentStatus) {
            // Configure gas settings for Polygon Amoy
            const gasSettings = {
                maxFeePerGas: hre.ethers.parseUnits("50", "gwei"),
                maxPriorityFeePerGas: hre.ethers.parseUnits("25", "gwei"),
                gasLimit: 500000
            };

            // Authorize merchant
            console.log("\nSubmitting authorization transaction...");
            const tx = await contract.setMerchantStatus(merchantAddress, true, gasSettings);
            console.log("Transaction Hash:", tx.hash);
            
            console.log("Waiting for confirmation...");
            const receipt = await tx.wait();
            
            // Verify new status
            const newStatus = await contract.authorizedMerchants(merchantAddress);
            
            console.log("\nAuthorization Complete!");
            console.log("========================");
            console.log("Transaction Hash:", receipt.hash);
            console.log("Gas Used:", receipt.gasUsed.toString());
            console.log("New Authorization Status:", newStatus);
        } else {
            console.log("\nMerchant is already authorized!");
        }

        // Final verification
        const finalStatus = await contract.authorizedMerchants(merchantAddress);
        
        return {
            success: true,
            contractAddress,
            merchantAddress,
            isAuthorized: finalStatus,
            ownerAddress: owner.address
        };

    } catch (error) {
        console.error("\nError during merchant authorization:");
        console.error("=================================");
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