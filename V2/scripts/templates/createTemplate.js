const hre = require("hardhat");
require('dotenv').config({ path: 'V2.env' });

async function main() {
    try {
        console.log("Starting template setup...");

        // Get template type from environment
        const templateType = process.env.TEMPLATE_TYPE || "ALL";
        console.log(`Template Type: ${templateType}`);

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        if (!contractAddress) {
            throw new Error("WAVEX_NFT_V2_ADDRESS not found in environment variables");
        }

        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Gas settings
        const gasSettings = {
            gasLimit: process.env.GAS_LIMIT || 5000000,
            gasPrice: process.env.GAS_PRICE || 35000000000
        };

        // Template configurations
        const templates = [
            {
                id: process.env.TEMPLATE_BLACK_ID,
                name: "Black",
                baseBalance: hre.ethers.parseEther("10000"),
                price: hre.ethers.parseEther("10000"),
                active: true
            },
            {
                id: process.env.TEMPLATE_GOLD_ID,
                name: "Gold",
                baseBalance: hre.ethers.parseEther("2000"),
                price: hre.ethers.parseEther("2000"),
                active: true
            },
            {
                id: process.env.TEMPLATE_PLATINUM_ID,
                name: "Platinum",
                baseBalance: hre.ethers.parseEther("5000"),
                price: hre.ethers.parseEther("5000"),
                active: true
            },
            {
                id: process.env.TEMPLATE_EVENTBRITE_ID,
                name: "EventBrite",
                baseBalance: 0,
                price: 0,
                active: true
            }
        ];

        // Filter templates based on TEMPLATE_TYPE
        const templatesToCreate = templateType === "ALL" 
            ? templates 
            : templates.filter(t => t.name.toUpperCase() === templateType.toUpperCase());

        console.log("\nCreating templates...");
        for (const template of templatesToCreate) {
            console.log(`\nProcessing ${template.name} template...`);
            console.log("Template Details:");
            console.log("=================");
            console.log("ID:", template.id);
            console.log("Name:", template.name);
            console.log("Base Balance:", hre.ethers.formatEther(template.baseBalance.toString()), "WAVEX");
            console.log("Price:", hre.ethers.formatEther(template.price.toString()), "WAVEX");

            // Create template
            const tx = await wavexNFT.addTemplate(
                template.id,
                template.name,
                template.baseBalance,
                template.price,
                template.active,
                gasSettings
            );

            console.log("Transaction submitted:", tx.hash);
            const receipt = await tx.wait();
            console.log("Transaction confirmed");

            // Verify template
            const createdTemplate = await wavexNFT.templates(template.id);
            console.log("\nTemplate Verification:");
            console.log("=====================");
            console.log("Name:", createdTemplate.name);
            console.log("Base Balance:", hre.ethers.formatEther(createdTemplate.baseBalance), "WAVEX");
            console.log("Price:", hre.ethers.formatEther(createdTemplate.price), "WAVEX");
            console.log("Active:", createdTemplate.active);
        }

        console.log("\nTemplate setup completed successfully!");

    } catch (error) {
        console.error("\nError in template setup:", error);
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