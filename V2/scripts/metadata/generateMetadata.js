// scripts/metadata/generateMetadata.js
const { TEMPLATE_METADATA, STANDARD_CONFIG } = require('../config/metadataConfig');
const { EVENT_METADATA, EVENT_CONFIG } = require('../config/eventConfig');
const { uploadToIPFS } = require('../utils/pinataUtils');
const path = require('path');
const fs = require('fs').promises;

/**
 * Generates metadata for NFTs, templates, or events
 * @param {string} type Type of metadata to generate ('NFT', 'TEMPLATE', 'EVENT')
 * @param {Object} data Data to include in metadata
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Generated metadata
 */
async function generateMetadata(type, data, options = {}) {
    try {
        let metadata;
        const baseMetadata = {
            name: data.name || "WaveX Asset",
            description: data.description || "A WaveX digital asset",
            image: data.image || "ipfs://QmDefaultImageHash",
            attributes: [],
            properties: {
                type,
                createdAt: new Date().toISOString(),
                ...(options.properties || {})
            }
        };

        switch (type.toUpperCase()) {
            case 'NFT':
                metadata = await generateNFTMetadata(data, baseMetadata, options);
                break;
            case 'TEMPLATE':
                metadata = await generateTemplateMetadata(data, baseMetadata, options);
                break;
            case 'EVENT':
                metadata = await generateEventMetadata(data, baseMetadata, options);
                break;
            default:
                throw new Error(`Unsupported metadata type: ${type}`);
        }

        // Validate metadata
        validateMetadata(metadata);

        return metadata;

    } catch (error) {
        console.error("Error generating metadata:", error);
        throw error;
    }
}

/**
 * Generates NFT-specific metadata
 * @private
 */
async function generateNFTMetadata(data, baseMetadata, options) {
    const metadata = {
        ...baseMetadata,
        name: data.name || `WaveX NFT #${Date.now()}`,
        attributes: [
            {
                trait_type: "Token ID",
                value: data.tokenId?.toString() || "0"
            },
            {
                trait_type: "Template",
                value: data.templateId?.toString() || "Custom"
            },
            {
                trait_type: "Balance",
                value: data.balance?.toString() || "0"
            },
            ...(data.attributes || [])
        ],
        properties: {
            ...baseMetadata.properties,
            tokenId: data.tokenId,
            templateId: data.templateId,
            owner: data.owner
        }
    };

    return metadata;
}

/**
 * Generates template-specific metadata
 * @private
 */
async function generateTemplateMetadata(data, baseMetadata, options) {
    const metadata = {
        ...baseMetadata,
        name: data.name || `WaveX Template #${data.templateId}`,
        attributes: [
            {
                trait_type: "Template ID",
                value: data.templateId?.toString()
            },
            {
                trait_type: "Base Balance",
                value: data.baseBalance?.toString()
            },
            {
                trait_type: "Price",
                value: data.price?.toString()
            },
            {
                trait_type: "Discount",
                value: `${data.discount || 0}%`
            },
            {
                trait_type: "VIP",
                value: data.isVIP ? "Yes" : "No"
            },
            ...(data.attributes || [])
        ],
        properties: {
            ...baseMetadata.properties,
            templateId: data.templateId,
            active: data.active
        }
    };

    return metadata;
}

/**
 * Generates event-specific metadata
 * @private
 */
async function generateEventMetadata(data, baseMetadata, options) {
    const metadata = {
        ...baseMetadata,
        name: data.name || `WaveX Event #${data.eventId}`,
        attributes: [
            {
                trait_type: "Event ID",
                value: data.eventId?.toString()
            },
            {
                trait_type: "Capacity",
                value: data.capacity?.toString()
            },
            {
                trait_type: "Price",
                value: data.price?.toString()
            },
            {
                trait_type: "Type",
                value: data.eventType?.toString() || "Standard"
            },
            {
                trait_type: "Status",
                value: data.active ? "Active" : "Inactive"
            },
            ...(data.attributes || [])
        ],
        properties: {
            ...baseMetadata.properties,
            eventId: data.eventId,
            active: data.active,
            soldCount: data.soldCount || 0
        }
    };

    return metadata;
}

/**
 * Validates metadata structure
 * @param {Object} metadata Metadata to validate
 * @throws {Error} If metadata is invalid
 */
function validateMetadata(metadata) {
    const requiredFields = ['name', 'description', 'image', 'attributes'];
    const missingFields = requiredFields.filter(field => !metadata[field]);
    
    if (missingFields.length > 0) {
        throw new Error(`Missing required metadata fields: ${missingFields.join(', ')}`);
    }

    if (!Array.isArray(metadata.attributes)) {
        throw new Error('Metadata attributes must be an array');
    }

    metadata.attributes.forEach((attr, index) => {
        if (!attr.trait_type || !attr.value) {
            throw new Error(`Invalid attribute at index ${index}: missing trait_type or value`);
        }
    });
}

/**
 * Saves metadata to local storage and IPFS
 * @param {string} type Metadata type
 * @param {string|number} id Asset ID
 * @param {Object} metadata Metadata to save
 * @returns {Promise<string>} IPFS URI
 */
async function saveMetadata(type, id, metadata) {
    try {
        // Determine storage path based on type
        let storagePath;
        switch (type.toUpperCase()) {
            case 'NFT':
                storagePath = 'metadata/nfts';
                break;
            case 'TEMPLATE':
                storagePath = STANDARD_CONFIG.metadataPath;
                break;
            case 'EVENT':
                storagePath = EVENT_CONFIG.metadataPath;
                break;
            default:
                throw new Error(`Unsupported metadata type: ${type}`);
        }

        // Ensure directory exists
        const metadataDir = path.join(process.cwd(), storagePath);
        await fs.mkdir(metadataDir, { recursive: true });

        // Save locally
        const localPath = path.join(metadataDir, `${id}.json`);
        await fs.writeFile(localPath, JSON.stringify(metadata, null, 2));

        // Upload to IPFS
        const ipfsHash = await uploadToIPFS(JSON.stringify(metadata));
        console.log(`Metadata saved for ${type} ${id}. IPFS hash: ${ipfsHash}`);

        return `ipfs://${ipfsHash}`;

    } catch (error) {
        console.error("Error saving metadata:", error);
        throw error;
    }
}

module.exports = {
    generateMetadata,
    validateMetadata,
    saveMetadata
};