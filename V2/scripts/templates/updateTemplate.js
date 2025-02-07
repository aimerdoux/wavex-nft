// scripts/templates/updateTemplate.js
const { TEMPLATE_METADATA } = require('../config/metadataConfig');
const { getTemplateMetadata } = require('../config/templateConfig');
const { uploadToIPFS } = require('../utils/pinataUtils');

async function updateTemplate(templateId, updates = {}, options = {}) {
    try {
        // Get current template data
        const currentTemplate = await getTemplateMetadata(templateId);
        
        // Update metadata if provided
        if (updates.metadata) {
            TEMPLATE_METADATA[templateId] = {
                ...TEMPLATE_METADATA[templateId],
                ...updates.metadata
            };
            
            // Generate and upload new metadata
            const newMetadata = await getTemplateMetadata(templateId);
            const metadataURI = await uploadToIPFS(JSON.stringify(newMetadata));
            updates.metadataURI = `ipfs://${metadataURI}`;
        }

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Update on-chain data
        const tx = await wavexNFT.updateTemplate(
            templateId,
            updates.name || currentTemplate.onChainData.name,
            updates.baseBalance ? hre.ethers.parseEther(updates.baseBalance) : currentTemplate.onChainData.baseBalance,
            updates.price ? hre.ethers.parseEther(updates.price) : currentTemplate.onChainData.price,
            updates.discount || currentTemplate.onChainData.discount,
            updates.isVIP ?? currentTemplate.onChainData.isVIP,
            updates.metadataURI || currentTemplate.onChainData.metadataURI,
            options.gasLimit
        );

        console.log(`Updating template ${templateId}...`);
        const receipt = await tx.wait();
        
        console.log(`Template updated successfully! Transaction: ${receipt.transactionHash}`);
        return { templateId, transactionHash: receipt.transactionHash };
    } catch (error) {
        console.error("Error updating template:", error);
        throw error;
    }
}