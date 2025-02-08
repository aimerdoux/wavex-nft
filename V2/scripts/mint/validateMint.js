// scripts/mint/validateMint.js
const hre = require("hardhat");
const { validateTemplateMetadata } = require('../templates/templateMetadata');
const { isAddress } = require('ethers/lib/utils');

/**
 * Validates mint parameters and requirements
 * @param {Object} params Parameters to validate
 * @param {string|number} params.templateId Template ID
 * @param {string} params.to Recipient address
 * @param {Object} params.metadata Optional metadata
 * @returns {Promise<Object>} Validation result
 */
async function validateMint(params) {
    try {
        const validationResults = {
            valid: true,
            checks: {},
            errors: []
        };

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Check template ID
        try {
            const template = await wavexNFT.getTemplate(params.templateId);
            validationResults.checks.template = {
                exists: true,
                active: template.active,
                price: hre.ethers.formatEther(template.price),
                baseBalance: hre.ethers.formatEther(template.baseBalance)
            };

            if (!template.active) {
                validationResults.valid = false;
                validationResults.errors.push("Template is not active");
            }
        } catch (error) {
            validationResults.valid = false;
            validationResults.checks.template = { exists: false };
            validationResults.errors.push("Template does not exist");
        }

        // Validate recipient address
        if (!params.to || !isAddress(params.to)) {
            validationResults.valid = false;
            validationResults.checks.recipient = { valid: false };
            validationResults.errors.push("Invalid recipient address");
        } else {
            validationResults.checks.recipient = { valid: true };
        }

        // Check if recipient is a contract
        const recipientCode = await hre.ethers.provider.getCode(params.to);
        const isContract = recipientCode !== '0x';
        validationResults.checks.recipient.isContract = isContract;

        if (isContract) {
            try {
                // Check if contract implements ERC721Receiver
                const supportsERC721 = await wavexNFT.supportsInterface('0x150b7a02');
                validationResults.checks.recipient.supportsERC721 = supportsERC721;
                
                if (!supportsERC721) {
                    validationResults.valid = false;
                    validationResults.errors.push("Recipient contract does not implement ERC721Receiver");
                }
            } catch (error) {
                validationResults.valid = false;
                validationResults.errors.push("Could not verify ERC721 receiver support");
            }
        }

        // Validate metadata if provided
        if (params.metadata) {
            try {
                validateTemplateMetadata({
                    ...params.metadata,
                    attributes: params.metadata.attributes || []
                });
                validationResults.checks.metadata = { valid: true };
            } catch (error) {
                validationResults.valid = false;
                validationResults.checks.metadata = { valid: false };
                validationResults.errors.push(`Invalid metadata: ${error.message}`);
            }
        }

        // Check contract pause status
        try {
            const paused = await wavexNFT.paused();
            validationResults.checks.contract = { paused };
            
            if (paused) {
                validationResults.valid = false;
                validationResults.errors.push("Contract is paused");
            }
        } catch (error) {
            validationResults.errors.push("Could not check contract pause status");
        }

        // Estimate gas for the mint transaction
        if (validationResults.valid) {
            try {
                const template = await wavexNFT.getTemplate(params.templateId);
                const gasEstimate = await wavexNFT.estimateGas.mintFromTemplate(
                    params.templateId,
                    params.to,
                    "ipfs://placeholder",
                    { value: template.price }
                );
                
                validationResults.checks.gas = {
                    estimated: true,
                    estimate: gasEstimate.toString()
                };
            } catch (error) {
                validationResults.valid = false;
                validationResults.checks.gas = { estimated: false };
                validationResults.errors.push(`Gas estimation failed: ${error.message}`);
            }
        }

        return validationResults;

    } catch (error) {
        console.error("Error validating mint parameters:", error);
        throw error;
    }
}

/**
 * Batch validates mint parameters for multiple recipients
 * @param {Object} params Batch validation parameters
 * @param {string|number} params.templateId Template ID
 * @param {string[]} params.recipients Array of recipient addresses
 * @param {Object} params.metadata Base metadata
 * @returns {Promise<Object>} Batch validation results
 */
async function batchValidateMint(params) {
    try {
        if (!Array.isArray(params.recipients)) {
            throw new Error("Recipients must be an array");
        }

        const results = await Promise.all(
            params.recipients.map(to =>
                validateMint({
                    templateId: params.templateId,
                    to,
                    metadata: params.metadata
                })
            )
        );

        return {
            templateId: params.templateId,
            totalValidations: params.recipients.length,
            validCount: results.filter(r => r.valid).length,
            invalidCount: results.filter(r => !r.valid).length,
            results: results.map((result, index) => ({
                recipient: params.recipients[index],
                ...result
            }))
        };

    } catch (error) {
        console.error("Error in batch validation:", error);
        throw error;
    }
}

module.exports = {
    validateMint,
    batchValidateMint
};