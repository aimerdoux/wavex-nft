// scripts/mint/batchMint.js
const hre = require("hardhat");
const { mintFromTemplate } = require('./mintFromTemplate');
const { validateMint, batchValidateMint } = require('./validateMint');
const { uploadToIPFS } = require('../utils/pinataUtils');

/**
 * Processes a batch of mints with optimizations
 * @param {Object} params Batch parameters
 * @param {string|number} params.templateId Template ID
 * @param {string[]} params.recipients Array of recipient addresses
 * @param {Object} params.metadata Base metadata for all NFTs
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Batch results
 */
async function batchMint(params, options = {}) {
    try {
        if (!params.templateId || !Array.isArray(params.recipients)) {
            throw new Error("Template ID and recipients array are required");
        }

        // Validate all recipients first
        console.log("Validating batch mint parameters...");
        const validationResults = await batchValidateMint({
            templateId: params.templateId,
            recipients: params.recipients,
            metadata: params.metadata
        });

        if (validationResults.invalidCount > 0) {
            console.warn(`Found ${validationResults.invalidCount} invalid recipients`);
            if (!options.skipInvalid) {
                throw new Error("Batch contains invalid recipients. Set skipInvalid: true to proceed with valid ones only.");
            }
        }

        // Filter valid recipients if skipInvalid is true
        const validRecipients = options.skipInvalid ?
            validationResults.results
                .filter(r => r.valid)
                .map(r => r.recipient) :
            params.recipients;

        if (validRecipients.length === 0) {
            throw new Error("No valid recipients to process");
        }

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get template details for price calculation
        const template = await wavexNFT.getTemplate(params.templateId);
        const mintPrice = template.price;
        const totalCost = mintPrice.mul(validRecipients.length);

        console.log(`Batch minting ${validRecipients.length} NFTs from template ${params.templateId}`);
        console.log(`Total cost: ${hre.ethers.formatEther(totalCost)} ETH`);

        // Process in batches if needed
        const batchSize = options.batchSize || 50; // Default to 50 mints per batch
        const batches = [];
        
        for (let i = 0; i < validRecipients.length; i += batchSize) {
            batches.push(validRecipients.slice(i, i + batchSize));
        }

        const results = [];
        let successCount = 0;
        let failureCount = 0;

        // Process each batch
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`Processing batch ${i + 1} of ${batches.length} (${batch.length} mints)`);

            const batchPromises = batch.map(async (recipient, index) => {
                try {
                    // Generate unique metadata for each NFT
                    const nftIndex = i * batchSize + index;
                    const nftMetadata = {
                        ...params.metadata,
                        name: `${params.metadata?.name || 'WaveX NFT'} #${nftIndex + 1}`,
                        attributes: [
                            ...(params.metadata?.attributes || []),
                            {
                                trait_type: "Batch",
                                value: `${i + 1}/${batches.length}`
                            },
                            {
                                trait_type: "Batch Index",
                                value: index + 1
                            }
                        ]
                    };

                    const result = await mintFromTemplate(
                        {
                            templateId: params.templateId,
                            to: recipient,
                            metadata: nftMetadata
                        },
                        {
                            ...options,
                            value: mintPrice
                        }
                    );

                    successCount++;
                    return {
                        success: true,
                        recipient,
                        ...result
                    };
                } catch (error) {
                    failureCount++;
                    return {
                        success: false,
                        recipient,
                        error: error.message
                    };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // Optional delay between batches
            if (i < batches.length - 1 && options.batchDelay) {
                await new Promise(resolve => setTimeout(resolve, options.batchDelay));
            }
        }

        // Prepare final report
        const report = {
            templateId: params.templateId,
            totalAttempted: validRecipients.length,
            successfulMints: successCount,
            failedMints: failureCount,
            batchCount: batches.length,
            batchSize,
            totalCost: hre.ethers.formatEther(totalCost),
            results: results.map(r => ({
                recipient: r.recipient,
                success: r.success,
                ...(r.success ? {
                    tokenId: r.tokenId,
                    metadataURI: r.metadataURI,
                    transactionHash: r.transactionHash
                } : {
                    error: r.error
                })
            }))
        };

        console.log(`Batch minting completed: ${successCount} successful, ${failureCount} failed`);
        return report;

    } catch (error) {
        console.error("Error in batch minting:", error);
        throw error;
    }
}

module.exports = {
    batchMint
};