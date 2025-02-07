// scripts/templates/getTemplate.js
const { getTemplateMetadata } = require('../config/templateConfig');

async function getTemplate(templateId, options = {}) {
    try {
        // Get both on-chain and metadata information
        const templateData = await getTemplateMetadata(templateId);
        
        // Format output based on options
        const output = {
            onChain: templateData.onChainData,
            metadata: {
                opensea: templateData.opensea,
                nftVisual: templateData.nftVisual,
                appleWallet: templateData.appleWallet
            }
        };

        if (options.format === 'json') {
            console.log(JSON.stringify(output, null, 2));
        } else {
            console.log("\nTemplate Information:");
            console.log("===================");
            console.log("\nOn-Chain Data:");
            console.table(output.onChain);
            console.log("\nMetadata Preview Available for:");
            console.log("- OpenSea");
            console.log("- NFT Visual");
            console.log("- Apple Wallet");
        }

        return output;
    } catch (error) {
        console.error("Error getting template:", error);
        throw error;
    }
}