// scripts/templates/updateTemplate.js
const hre = require("hardhat");
const { TEMPLATE_METADATA } = require('../config/metadataConfig');
const { getTemplateMetadata } = require('../config/templateConfig');
const { uploadToIPFS } = require('../utils/pinataUtils');

/**
 * Updates an existing template's details
 * @param {string|number} templateId Template ID to update
 * @param {Object} updates Update parameters
 * @param {string} updates.name New template name
 * @param {string} updates.baseBalance New base balance in ETH
 * @param {string} updates.price New price in ETH
 * @param {number} updates.discount New discount percentage
 * @param {boolean} updates.isVIP New VIP status
 * @param {Object} updates.metadata New metadata updates
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Update result
 */
async function updateTemplate(templateId, updates = {}, options = {}) {
    try {
        // Validate template exists in metadata config
        if (!TEMPLATE_METADATA[templateId]) {
            throw new Error(`Template ID ${templateId} not found in metadata configuration`);
        }

        // Get current template data
        const currentTemplate = await getTemplateMetadata(templateId);

        if (Object.keys(updates).length === 0) {
            throw new Error("No updates provided");
        }

        // Handle metadata updates and IPFS upload if needed
        let metadataURI;
        if (updates.metadata) {
            // Update metadata in config
            TEMPLATE_METADATA[templateId] = {
                ...TEMPLATE_METADATA[templateId],
                ...updates.metadata
            };

            // Generate and upload new metadata
            const newMetadata = await getTemplateMetadata(templateId);
            metadataURI = await uploadToIPFS(JSON.stringify(newMetadata));
            updates.metadataURI = `ipfs://${metadataURI}`;
        }

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Prepare arguments for modifyTemplate
        const args = [
            templateId,
            updates.name || currentTemplate.name,
            updates.baseBalance ? 
                hre.ethers.parseEther(updates.baseBalance.toString()) : 
                hre.ethers.parseEther(currentTemplate.baseBalance.toString()),
            updates.price ? 
                hre.ethers.parseEther(updates.price.toString()) : 
                hre.ethers.parseEther(currentTemplate.price.toString()),
            updates.discount ?? currentTemplate.discount,
            updates.isVIP ?? currentTemplate.isVIP,
            updates.metadataURI || currentTemplate.metadataURI,
            updates.active ?? currentTemplate.active
        ];

        console.log(`Modifying template ${templateId} with updates:`, {
            name: args[1],
            baseBalance: hre.ethers.formatEther(args[2]),
            price: hre.ethers.formatEther(args[3]),
            discount: args[4],
            isVIP: args[5],
            metadataURI: args[6],
            active: args[7]
        });

        // Call modifyTemplate on contract
        const tx = await wavexNFT.modifyTemplate(...args, {
            gasLimit: options.gasLimit
        });

        console.log(`Updating template ${templateId}...`);
        const receipt = await tx.wait();

        // Parse the TemplateUpdated event
        const templateUpdatedLog = receipt.logs.find(
            log => log.topics[0] === wavexNFT.interface.getEventTopic('TemplateUpdated')
        );

        let eventData = {};
        if (templateUpdatedLog) {
            const parsedLog = wavexNFT.interface.parseLog(templateUpdatedLog);
            eventData = {
                templateId: parsedLog.args.templateId.toString(),
                name: parsedLog.args.name,
                baseBalance: hre.ethers.formatEther(parsedLog.args.baseBalance),
                price: hre.ethers.formatEther(parsedLog.args.price),
                discount: parsedLog.args.discount.toString(),
                isVIP: parsedLog.args.isVIP,
                metadataURI: parsedLog.args.metadataURI,
                active: parsedLog.args.active
            };
        }

        console.log(`Template updated successfully! Transaction: ${receipt.transactionHash}`);
        return {
            templateId,
            transactionHash: receipt.transactionHash,
            updates: eventData
        };

    } catch (error) {
        console.error("Error updating template:", error);
        throw error;
    }
}

module.exports = {
    updateTemplate
};