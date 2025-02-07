// scripts/templates/listTemplates.js
const { TEMPLATE_METADATA } = require('../config/metadataConfig');
const { getTemplateMetadata } = require('../config/templateConfig');

async function listTemplates(options = {}) {
    try {
        const templates = [];
        
        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get template count
        const templateCount = await wavexNFT.getTemplateCount();

        console.log("\nFetching template information...");
        
        // Fetch all templates
        for (let i = 1; i <= templateCount; i++) {
            const templateData = await getTemplateMetadata(i);
            templates.push({
                id: i,
                name: templateData.onChainData.name,
                baseBalance: templateData.onChainData.baseBalance,
                price: templateData.onChainData.price,
                discount: templateData.onChainData.discount,
                isVIP: templateData.onChainData.isVIP,
                active: templateData.onChainData.active,
                benefitsCount: TEMPLATE_METADATA[i]?.benefits.length || 0,
                hasMetadata: !!TEMPLATE_METADATA[i]
            });
        }

        if (options.format === 'json') {
            console.log(JSON.stringify(templates, null, 2));
        } else {
            console.log("\nTemplate List:");
            console.log("==============");
            console.table(templates);
        }

        return templates;
    } catch (error) {
        console.error("Error listing templates:", error);
        throw error;
    }
}