const hre = require("hardhat");
require('dotenv').config({ path: 'V2.env' });
const Table = require('cli-table3');

async function getTemplateDetails(wavexNFT, templateId) {
    const template = await wavexNFT.templates(templateId);
    return {
        id: templateId,
        name: template.name,
        baseBalance: hre.ethers.formatEther(template.baseBalance),
        price: hre.ethers.formatEther(template.price),
        active: template.active
    };
}

async function main() {
    try {
        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        if (!contractAddress) {
            throw new Error("WAVEX_NFT_V2_ADDRESS not found in environment variables");
        }

        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get template ID from command line or environment
        const templateId = process.env.TEMPLATE_ID || "ALL";
        
        console.log("\nRetrieving template information...");

        if (templateId === "ALL") {
            // Create a table for all templates
            const table = new Table({
                head: ['ID', 'Name', 'Base Balance', 'Price', 'Status'],
                colWidths: [5, 15, 15, 15, 10]
            });

            // Default template IDs
            const templateIds = [
                process.env.TEMPLATE_GOLD_ID || 1,
                process.env.TEMPLATE_PLATINUM_ID || 2,
                process.env.TEMPLATE_BLACK_ID || 3,
                process.env.TEMPLATE_EVENTBRITE_ID || 4
            ];

            for (const id of templateIds) {
                try {
                    const template = await getTemplateDetails(wavexNFT, id);
                    if (template.name !== "") {  // Only add if template exists
                        table.push([
                            template.id,
                            template.name,
                            template.baseBalance,
                            template.price,
                            template.active ? '✅' : '❌'
                        ]);
                    }
                } catch (error) {
                    console.log(`Template ${id} not found or error: ${error.message}`);
                }
            }

            console.log("\nTemplate List:");
            console.log("==============");
            console.log(table.toString());

        } else {
            // Get specific template details
            const template = await getTemplateDetails(wavexNFT, templateId);
            
            console.log("\nTemplate Details:");
            console.log("================");
            console.log("ID:", template.id);
            console.log("Name:", template.name);
            console.log("Base Balance:", template.baseBalance, "WAVEX");
            console.log("Price:", template.price, "WAVEX");
            console.log("Status:", template.active ? "Active ✅" : "Inactive ❌");
        }

        return {
            successful: true,
            templateId: templateId,
            type: templateId === "ALL" ? "all_templates" : "single_template"
        };

    } catch (error) {
        console.error("\nError retrieving template details:", error);
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