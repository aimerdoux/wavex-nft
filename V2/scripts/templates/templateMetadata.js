// scripts/templates/templateMetadata.js
const { TEMPLATE_METADATA, STANDARD_CONFIG } = require('../config/metadataConfig');
const { uploadToIPFS } = require('../utils/pinataUtils');
const path = require('path');
const fs = require('fs').promises;

/**
 * Validates template metadata structure
 * @param {Object} metadata The metadata object to validate
 * @throws {Error} If metadata is invalid
 */
function validateTemplateMetadata(metadata) {
    const requiredFields = ['name', 'description', 'image'];
    const missingFields = requiredFields.filter(field => !metadata[field]);
    
    if (missingFields.length > 0) {
        throw new Error(`Missing required metadata fields: ${missingFields.join(', ')}`);
    }

    if (!metadata.attributes || !Array.isArray(metadata.attributes)) {
        throw new Error('Metadata must include attributes array');
    }

    const requiredAttributes = ['Type', 'Base Balance', 'Price'];
    const attributeTypes = metadata.attributes.map(attr => attr.trait_type);
    const missingAttributes = requiredAttributes.filter(
        attr => !attributeTypes.includes(attr)
    );

    if (missingAttributes.length > 0) {
        throw new Error(`Missing required attributes: ${missingAttributes.join(', ')}`);
    }
}

/**
 * Generates metadata for a template
 * @param {Object} template Template details
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Generated metadata
 */
async function generateTemplateMetadata(template, options = {}) {
    const metadata = {
        name: template.name,
        description: options.description || `${template.name} - A WaveX Template`,
        image: options.image || "ipfs://QmDefaultTemplateImageHash",
        attributes: [
            {
                trait_type: "Type",
                value: template.isVIP ? "VIP" : "Standard"
            },
            {
                trait_type: "Base Balance",
                value: template.baseBalance.toString()
            },
            {
                trait_type: "Price",
                value: template.price.toString()
            },
            {
                trait_type: "Discount",
                value: `${template.discount}%`
            },
            ...(options.attributes || [])
        ],
        properties: {
            templateId: template.id,
            createdAt: new Date().toISOString(),
            ...(options.properties || {})
        }
    };

    // Validate metadata
    validateTemplateMetadata(metadata);
    return metadata;
}

/**
 * Saves template metadata to local storage and IPFS
 * @param {string|number} templateId Template ID
 * @param {Object} metadata Template metadata
 * @returns {Promise<string>} IPFS URI of uploaded metadata
 */
async function saveTemplateMetadata(templateId, metadata) {
    try {
        // Validate metadata first
        validateTemplateMetadata(metadata);

        // Ensure metadata directory exists
        const metadataDir = path.join(process.cwd(), STANDARD_CONFIG.metadataPath);
        await fs.mkdir(metadataDir, { recursive: true });

        // Save metadata locally
        const localPath = path.join(metadataDir, `${templateId}.json`);
        await fs.writeFile(localPath, JSON.stringify(metadata, null, 2));

        // Upload to IPFS
        const ipfsHash = await uploadToIPFS(JSON.stringify(metadata));
        console.log(`Metadata saved for template ${templateId}. IPFS hash: ${ipfsHash}`);

        return `ipfs://${ipfsHash}`;
    } catch (error) {
        console.error("Error saving template metadata:", error);
        throw error;
    }
}

/**
 * Updates existing template metadata
 * @param {string|number} templateId Template ID
 * @param {Object} updates Metadata updates
 * @returns {Promise<string>} New IPFS URI
 */
async function updateTemplateMetadata(templateId, updates) {
    try {
        // Get existing metadata
        const metadataPath = path.join(
            process.cwd(),
            STANDARD_CONFIG.metadataPath,
            `${templateId}.json`
        );
        
        let existingMetadata;
        try {
            const data = await fs.readFile(metadataPath, 'utf8');
            existingMetadata = JSON.parse(data);
        } catch (error) {
            existingMetadata = {};
        }

        // Merge updates with existing metadata
        const updatedMetadata = {
            ...existingMetadata,
            ...updates,
            attributes: [
                ...(existingMetadata.attributes || []).filter(
                    attr => !updates.attributes?.some(
                        newAttr => newAttr.trait_type === attr.trait_type
                    )
                ),
                ...(updates.attributes || [])
            ],
            properties: {
                ...existingMetadata.properties,
                ...updates.properties,
                updatedAt: new Date().toISOString()
            }
        };

        // Save and upload updated metadata
        return await saveTemplateMetadata(templateId, updatedMetadata);
    } catch (error) {
        console.error("Error updating template metadata:", error);
        throw error;
    }
}

/**
 * Retrieves template metadata from local storage
 * @param {string|number} templateId Template ID
 * @returns {Promise<Object>} Template metadata
 */
async function getLocalTemplateMetadata(templateId) {
    try {
        const metadataPath = path.join(
            process.cwd(),
            STANDARD_CONFIG.metadataPath,
            `${templateId}.json`
        );
        
        const data = await fs.readFile(metadataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`No local metadata found for template ${templateId}`);
        return null;
    }
}

module.exports = {
    generateTemplateMetadata,
    validateTemplateMetadata,
    saveTemplateMetadata,
    updateTemplateMetadata,
    getLocalTemplateMetadata
};