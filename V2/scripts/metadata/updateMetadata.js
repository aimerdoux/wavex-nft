// scripts/metadata/updateMetadata.js
const { generateMetadata, validateMetadata, saveMetadata } = require('./generateMetadata');
const { uploadToIPFS } = require('../utils/pinataUtils');
const path = require('path');
const fs = require('fs').promises;

/**
 * Updates metadata for an existing asset
 * @param {string} type Asset type ('NFT', 'TEMPLATE', 'EVENT')
 * @param {string|number} id Asset ID
 * @param {Object} updates Metadata updates
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Update result
 */
async function updateMetadata(type, id, updates, options = {}) {
    try {
        // Get current metadata
        const currentMetadata = await getExistingMetadata(type, id);
        if (!currentMetadata && !options.createIfMissing) {
            throw new Error(`No existing metadata found for ${type} ${id}`);
        }

        // Merge updates with existing metadata
        const updatedMetadata = {
            ...currentMetadata,
            ...updates,
            name: updates.name || currentMetadata?.name,
            description: updates.description || currentMetadata?.description,
            image: updates.image || currentMetadata?.image,
            attributes: mergeAttributes(
                currentMetadata?.attributes || [],
                updates.attributes || []
            ),
            properties: {
                ...(currentMetadata?.properties || {}),
                ...(updates.properties || {}),
                updatedAt: new Date().toISOString()
            }
        };

        // Validate merged metadata
        validateMetadata(updatedMetadata);

        // Save and upload updated metadata
        const ipfsURI = await saveMetadata(type, id, updatedMetadata);

        return {
            id,
            type,
            metadataURI: ipfsURI,
            metadata: updatedMetadata,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error("Error updating metadata:", error);
        throw error;
    }
}

/**
 * Retrieves existing metadata for an asset
 * @private
 */
async function getExistingMetadata(type, id) {
    try {
        let metadataPath;
        switch (type.toUpperCase()) {
            case 'NFT':
                metadataPath = path.join(process.cwd(), 'metadata/nfts', `${id}.json`);
                break;
            case 'TEMPLATE':
                metadataPath = path.join(process.cwd(), 'metadata/templates', `${id}.json`);
                break;
            case 'EVENT':
                metadataPath = path.join(process.cwd(), 'metadata/events', `${id}.json`);
                break;
            default:
                throw new Error(`Unsupported metadata type: ${type}`);
        }

        const data = await fs.readFile(metadataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

/**
 * Merges attribute arrays, updating existing attributes and adding new ones
 * @private
 */
function mergeAttributes(existing, updates) {
    const merged = [...existing];
    
    updates.forEach(update => {
        const index = merged.findIndex(
            attr => attr.trait_type === update.trait_type
        );
        
        if (index >= 0) {
            merged[index] = update;
        } else {
            merged.push(update);
        }
    });

    return merged;
}

/**
 * Batch updates metadata for multiple assets
 * @param {string} type Asset type
 * @param {Array<Object>} updates Array of update operations
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Batch update results
 */
async function batchUpdateMetadata(type, updates, options = {}) {
    try {
        if (!Array.isArray(updates) || updates.length === 0) {
            throw new Error("At least one update operation is required");
        }

        const results = await Promise.allSettled(
            updates.map(update =>
                updateMetadata(
                    type,
                    update.id,
                    update.metadata,
                    options
                )
                    .then(result => ({
                        id: update.id,
                        success: true,
                        details: result
                    }))
                    .catch(error => ({
                        id: update.id,
                        success: false,
                        error: error.message
                    }))
            )
        );

        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);

        return {
            type,
            totalUpdates: updates.length,
            successfulUpdates: successful.length,
            failedUpdates: results.length - successful.length,
            timestamp: new Date().toISOString(),
            results: results.map(r => 
                r.status === 'fulfilled' ? r.value : {
                    id: r.reason.id,
                    success: false,
                    error: r.reason.message
                }
            )
        };

    } catch (error) {
        console.error("Error in batch metadata update:", error);
        throw error;
    }
}

/**
 * Validates and repairs metadata if needed
 * @param {string} type Asset type
 * @param {string|number} id Asset ID
 * @param {Object} options Repair options
 * @returns {Promise<Object>} Validation/repair result
 */
async function validateAndRepairMetadata(type, id, options = {}) {
    try {
        const metadata = await getExistingMetadata(type, id);
        if (!metadata) {
            throw new Error(`No metadata found for ${type} ${id}`);
        }

        const validationResult = {
            valid: true,
            repairs: [],
            warnings: []
        };

        // Check required fields
        const requiredFields = ['name', 'description', 'image', 'attributes'];
        requiredFields.forEach(field => {
            if (!metadata[field]) {
                validationResult.valid = false;
                validationResult.repairs.push({
                    field,
                    action: 'add',
                    value: field === 'attributes' ? [] : `Default ${field}`
                });
            }
        });

        // Check attributes structure
        if (Array.isArray(metadata.attributes)) {
            metadata.attributes.forEach((attr, index) => {
                if (!attr.trait_type || !attr.value) {
                    validationResult.valid = false;
                    validationResult.repairs.push({
                        field: `attributes[${index}]`,
                        action: 'fix',
                        details: 'Missing trait_type or value'
                    });
                }
            });
        }

        // Perform repairs if needed and authorized
        if (!validationResult.valid && options.autoRepair) {
            const repairs = {};
            
            validationResult.repairs.forEach(repair => {
                if (repair.action === 'add') {
                    repairs[repair.field] = repair.value;
                }
            });

            if (Object.keys(repairs).length > 0) {
                const repaired = await updateMetadata(type, id, repairs);
                validationResult.repairedMetadata = repaired;
            }
        }

        return validationResult;

    } catch (error) {
        console.error("Error validating/repairing metadata:", error);
        throw error;
    }
}

module.exports = {
    updateMetadata,
    batchUpdateMetadata,
    validateAndRepairMetadata
};