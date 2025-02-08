// scripts/metadata/validateMetadata.js
const { TEMPLATE_METADATA } = require('../config/metadataConfig');
const { EVENT_METADATA } = require('../config/eventConfig');

// Metadata schemas for different asset types
const METADATA_SCHEMAS = {
    NFT: {
        required: ['name', 'description', 'image', 'attributes'],
        attributes: ['Token ID', 'Template', 'Balance'],
        properties: ['tokenId', 'templateId', 'owner']
    },
    TEMPLATE: {
        required: ['name', 'description', 'image', 'attributes'],
        attributes: ['Template ID', 'Base Balance', 'Price', 'Discount', 'VIP'],
        properties: ['templateId', 'active']
    },
    EVENT: {
        required: ['name', 'description', 'image', 'attributes'],
        attributes: ['Event ID', 'Capacity', 'Price', 'Type', 'Status'],
        properties: ['eventId', 'active', 'soldCount']
    }
};

/**
 * Validates metadata against schema
 * @param {Object} metadata Metadata to validate
 * @param {string} type Asset type ('NFT', 'TEMPLATE', 'EVENT')
 * @returns {Object} Validation result
 */
function validateMetadata(metadata, type) {
    const schema = METADATA_SCHEMAS[type.toUpperCase()];
    if (!schema) {
        throw new Error(`Unknown metadata type: ${type}`);
    }

    const result = {
        valid: true,
        errors: [],
        warnings: []
    };

    // Check required fields
    schema.required.forEach(field => {
        if (!metadata[field]) {
            result.valid = false;
            result.errors.push(`Missing required field: ${field}`);
        }
    });

    // Validate attributes
    if (Array.isArray(metadata.attributes)) {
        const attributeTypes = metadata.attributes.map(attr => attr.trait_type);
        
        // Check required attributes
        schema.attributes.forEach(required => {
            if (!attributeTypes.includes(required)) {
                result.valid = false;
                result.errors.push(`Missing required attribute: ${required}`);
            }
        });

        // Validate attribute structure
        metadata.attributes.forEach((attr, index) => {
            if (!attr.trait_type || !attr.value) {
                result.valid = false;
                result.errors.push(
                    `Invalid attribute at index ${index}: missing trait_type or value`
                );
            }
        });
    } else {
        result.valid = false;
        result.errors.push("Attributes must be an array");
    }

    // Validate properties
    if (metadata.properties) {
        schema.properties.forEach(prop => {
            if (!(prop in metadata.properties)) {
                result.warnings.push(`Missing recommended property: ${prop}`);
            }
        });
    } else {
        result.warnings.push("Missing properties object");
    }

    // Type-specific validations
    switch (type.toUpperCase()) {
        case 'NFT':
            validateNFTMetadata(metadata, result);
            break;
        case 'TEMPLATE':
            validateTemplateMetadata(metadata, result);
            break;
        case 'EVENT':
            validateEventMetadata(metadata, result);
            break;
    }

    return result;
}

/**
 * Validates NFT-specific metadata
 * @private
 */
function validateNFTMetadata(metadata, result) {
    // Check token ID format
    const tokenIdAttr = metadata.attributes.find(
        attr => attr.trait_type === 'Token ID'
    );
    if (tokenIdAttr && isNaN(tokenIdAttr.value)) {
        result.errors.push("Token ID must be a number");
        result.valid = false;
    }

    // Check balance format
    const balanceAttr = metadata.attributes.find(
        attr => attr.trait_type === 'Balance'
    );
    if (balanceAttr && isNaN(balanceAttr.value)) {
        result.errors.push("Balance must be a number");
        result.valid = false;
    }
}

/**
 * Validates template-specific metadata
 * @private
 */
function validateTemplateMetadata(metadata, result) {
    // Check price format
    const priceAttr = metadata.attributes.find(
        attr => attr.trait_type === 'Price'
    );
    if (priceAttr && isNaN(priceAttr.value)) {
        result.errors.push("Price must be a number");
        result.valid = false;
    }

    // Check discount range
    const discountAttr = metadata.attributes.find(
        attr => attr.trait_type === 'Discount'
    );
    if (discountAttr) {
        const discount = parseInt(discountAttr.value);
        if (isNaN(discount) || discount < 0 || discount > 100) {
            result.errors.push("Discount must be a number between 0 and 100");
            result.valid = false;
        }
    }
}

/**
 * Validates event-specific metadata
 * @private
 */
function validateEventMetadata(metadata, result) {
    // Check capacity format
    const capacityAttr = metadata.attributes.find(
        attr => attr.trait_type === 'Capacity'
    );
    if (capacityAttr && isNaN(capacityAttr.value)) {
        result.errors.push("Capacity must be a number");
        result.valid = false;
    }

    // Check sold count
    if (metadata.properties && 'soldCount' in metadata.properties) {
        if (isNaN(metadata.properties.soldCount)) {
            result.errors.push("Sold count must be a number");
            result.valid = false;
        }
    }
}

/**
 * Validates IPFS URI format
 * @param {string} uri URI to validate
 * @returns {boolean} Whether URI is valid
 */
function validateIPFSUri(uri) {
    if (!uri) return false;
    
    // Check basic IPFS URI format
    const ipfsRegex = /^ipfs:\/\/[a-zA-Z0-9]{46}$/;
    return ipfsRegex.test(uri);
}

/**
 * Batch validates multiple metadata objects
 * @param {Array<Object>} metadataArray Array of metadata objects
 * @param {string} type Asset type
 * @returns {Object} Batch validation results
 */
function batchValidateMetadata(metadataArray, type) {
    if (!Array.isArray(metadataArray)) {
        throw new Error("Input must be an array of metadata objects");
    }

    const results = metadataArray.map((metadata, index) => {
        try {
            const result = validateMetadata(metadata, type);
            return {
                index,
                ...result
            };
        } catch (error) {
            return {
                index,
                valid: false,
                errors: [error.message],
                warnings: []
            };
        }
    });

    return {
        totalChecked: results.length,
        validCount: results.filter(r => r.valid).length,
        invalidCount: results.filter(r => !r.valid).length,
        results
    };
}

module.exports = {
    validateMetadata,
    validateIPFSUri,
    batchValidateMetadata,
    METADATA_SCHEMAS
};