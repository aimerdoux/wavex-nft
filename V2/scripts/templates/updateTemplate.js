const hre = require("hardhat");
require('dotenv').config({ path: 'V2.env' });

async function main() {
    try {
        console.log("Starting template update...");

        // Get template parameters from environment
        const templateId = process.env.UPDATE_TEMPLATE_ID;
        const newBaseBalance = process.env.UPDATE_BASE_BALANCE;
        const newPrice = process.env.UPDATE_PRICE;
        const newStatus = process.env.UPDATE_STATUS === 'true';

        if (!templateId) {
            throw new Error("UPDATE_TEMPLATE_ID not found in environment variables");
        }

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        if (!contractAddress) {
            throw new Error("WAVEX_NFT_V2_ADDRESS not found in environment variables");
        }

        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get current template data
        const currentTemplate = await wavexNFT.templates(templateId);
        console.log("\nCurrent Template Details:");
        console.log("========================");
        console.log("ID:", templateId);
        console.log("Name:", currentTemplate.name);
        console.log("Base Balance:", hre.ethers.formatEther(currentTemplate.baseBalance), "WAVEX");
        console.log("Price:", hre.ethers.formatEther(currentTemplate.price), "WAVEX");
        console.log("Active:", currentTemplate.active);

        // Gas settings
        const gasSettings = {
            gasLimit: process.env.GAS_LIMIT || 5000000,
            gasPrice: process.env.GAS_PRICE || 35000000000
        };

        // Prepare update parameters
        const updateParams = {
            baseBalance: newBaseBalance ? hre.ethers.parseEther(newBaseBalance) : currentTemplate.baseBalance,
            price: newPrice ? hre.ethers.parseEther(newPrice) : currentTemplate.price,
            active: newStatus !== undefined ? newStatus : currentTemplate.active
        };

        console.log("\nUpdating template...");
        console.log("New values to apply:");
        console.log("===================");
        console.log("Base Balance:", hre.ethers.formatEther(updateParams.baseBalance), "WAVEX");
        console.log("Price:", hre.ethers.formatEther(updateParams.price), "WAVEX");
        console.log("Active:", updateParams.active);

        // Update template using modifyTemplate function
        const tx = await wavexNFT.modifyTemplate(
            templateId,
            updateParams.baseBalance,
            updateParams.price,
            updateParams.active,
            gasSettings
        );

        console.log("\nTransaction submitted:", tx.hash);
        const receipt = await tx.wait();
        console.log("Transaction confirmed");

        // Verify update
        const updatedTemplate = await wavexNFT.templates(templateId);
        
        console.log("\nTemplate Update Verification:");
        console.log("===========================");
        console.log("ID:", templateId);
        console.log("Name:", updatedTemplate.name);
        console.log("Base Balance:", hre.ethers.formatEther(updatedTemplate.baseBalance), "WAVEX");
        console.log("Price:", hre.ethers.formatEther(updatedTemplate.price), "WAVEX");
        console.log("Active:", updatedTemplate.active);

        return {
            successful: true,
            templateId,
            transactionHash: receipt.hash,
            template: updatedTemplate
        };

    } catch (error) {
        console.error("\nError in template update:", error);
        process.exit(1);
    }
}

// Execute if script is run directly
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;