// scripts/merchant/authorizeMerchant.js
const hre = require("hardhat");
const path = require('path');
const fs = require('fs');
require('dotenv').config();

async function getDeployment(networkName) {
    const deploymentPath = path.join(__dirname, '../../deployments', `${networkName}_deployment.json`);
    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`No deployment found for network ${networkName}`);
    }
    return JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
}

async function main() {
    try {
        const networkName = hre.network.name;
        const deployment = await getDeployment(networkName);
        
        // Get contract instance
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const wavexNFT = WaveXNFT.attach(deployment.contractAddress);

        // Get current signer to authorize as merchant
        const [signer] = await hre.ethers.getSigners();
        const merchantAddress = process.env.MERCHANT_ADDRESS || signer.address;

        console.log("\nAuthorizing Merchant:");
        console.log("====================");
        console.log("Merchant Address:", merchantAddress);

        // Check current status
        const currentStatus = await wavexNFT.authorizedMerchants(merchantAddress);
        console.log("Current Authorization Status:", currentStatus);

        if (!currentStatus) {
            // Authorize merchant
            console.log("\nSubmitting authorization transaction...");
            const tx = await wavexNFT.setMerchantStatus(merchantAddress, true);
            await tx.wait();

            // Verify new status
            const newStatus = await wavexNFT.authorizedMerchants(merchantAddress);
            console.log("\nMerchant Authorization Complete!");
            console.log("New Authorization Status:", newStatus);
        } else {
            console.log("\nMerchant is already authorized!");
        }

        return {
            success: true,
            merchantAddress: merchantAddress,
            isAuthorized: true
        };

    } catch (error) {
        console.error("\nError during merchant authorization:", error);
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