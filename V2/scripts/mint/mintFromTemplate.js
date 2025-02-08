// scripts/mint/mintFromTemplate.js
const hre = require("hardhat");
const { getTemplateMetadata } = require('../templates/templateMetadata');
const { uploadToIPFS } = require('../utils/pinataUtils');
const { validateTemplateMetadata } = require('../templates/templateMetadata');

/**
 * Mints a new NFT from a template
 * @param {Object} params Minting parameters
 * @param {string|number} params.templateId Template ID to mint from
 * @param {string} params.to Address to mint to
 * @param {Object} params.metadata Custom metadata overrides
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Minting result
 */
async function mintFromTemplate(params, options = {}) {
    try {
        if (!params.templateId || !params.to) {
            throw new Error("Template ID and recipient address are required");
        }

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get template metadata
        const templateMetadata = await getTemplateMetadata(params.templateId);
        if (!templateMetadata) {
            throw new Error(`Template ${params.templateId} not found`);
        }

        // Generate NFT-specific metadata
        const nftMetadata = {
            ...templateMetadata,
            name: params.metadata?.name || `${templateMetadata.name} #${Date.now()}`,
            description: params.metadata?.description || templateMetadata.description,
            image: params.metadata?.image || templateMetadata.image,
            attributes: [
                ...templateMetadata.attributes,
                {
                    trait_type: "Mint Date",
                    value: new Date().toISOString()
                },
                ...(params.metadata?.attributes || [])
            ],
            properties: {
                ...templateMetadata.properties,
                mintedTo: params.to,
                mintedAt: new Date().toISOString(),
                ...(params.metadata?.properties || {})
            }
        };

        // Validate metadata
        validateTemplateMetadata(nftMetadata);

        // Upload metadata to IPFS
        const metadataURI = await uploadToIPFS(JSON.stringify(nftMetadata));
        console.log(`Metadata uploaded to IPFS: ${metadataURI}`);

        // Calculate value to send if template has a price
        const template = await wavexNFT.getTemplate(params.templateId);
        const value = template.price;

        // Mint NFT
        console.log(`Minting NFT from template ${params.templateId} to ${params.to}...`);
        const tx = await wavexNFT.mintFromTemplate(
            params.templateId,
            params.to,
            `ipfs://${metadataURI}`,
            {
                value,
                gasLimit: options.gasLimit
            }
        );

        const receipt = await tx.wait();

        // Find the Transfer event to get the token ID
        const transferEvent = receipt.logs.find(
            log => log.topics[0] === wavexNFT.interface.getEventTopic('Transfer')
        );

        let tokenId;
        if (transferEvent) {
            const parsedLog = wavexNFT.interface.parseLog(transferEvent);
            tokenId = parsedLog.args.tokenId.toString();
        }

        // Find the BalanceUpdated event
        const balanceEvent = receipt.logs.find(
            log => log.topics[0] === wavexNFT.interface.getEventTopic('BalanceUpdated')
        );

        let initialBalance;
        if (balanceEvent) {
            const parsedLog = wavexNFT.interface.parseLog(balanceEvent);
            initialBalance = hre.ethers.formatEther(parsedLog.args.newBalance);
        }

        console.log(`NFT minted successfully! Token ID: ${tokenId}`);
        
        return {
            tokenId,
            owner: params.to,
            templateId: params.templateId,
            initialBalance,
            metadataURI: `ipfs://${metadataURI}`,
            transactionHash: receipt.transactionHash
        };

    } catch (error) {
        console.error("Error minting from template:", error);
        throw error;
    }
}

/**
 * Batch mints multiple NFTs from a template
 * @param {Object} params Batch minting parameters
 * @param {string|number} params.templateId Template ID to mint from
 * @param {string[]} params.recipients Array of recipient addresses
 * @param {Object} params.metadata Base metadata for all NFTs
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Batch minting results
 */
async function batchMintFromTemplate(params, options = {}) {
    try {
        if (!params.templateId || !Array.isArray(params.recipients)) {
            throw new Error("Template ID and recipients array are required");
        }

        const results = await Promise.allSettled(
            params.recipients.map((to, index) =>
                mintFromTemplate(
                    {
                        templateId: params.templateId,
                        to,
                        metadata: {
                            ...params.metadata,
                            name: `${params.metadata?.name || 'WaveX NFT'} #${index + 1}`
                        }
                    },
                    options
                )
            )
        );

        const successful = results.filter(r => r.status === 'fulfilled');
        const failed = results.filter(r => r.status === 'rejected');

        return {
            templateId: params.templateId,
            totalAttempts: params.recipients.length,
            successfulMints: successful.length,
            failedMints: failed.length,
            results: results.map((result, index) => ({
                recipient: params.recipients[index],
                success: result.status === 'fulfilled',
                ...(result.status === 'fulfilled' ? 
                    { details: result.value } : 
                    { error: result.reason.message })
            }))
        };

    } catch (error) {
        console.error("Error in batch minting:", error);
        throw error;
    }
}

module.exports = {
    mintFromTemplate,
    batchMintFromTemplate
};