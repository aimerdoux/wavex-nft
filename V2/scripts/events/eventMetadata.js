// scripts/events/eventMetadata.js
const { EVENT_TYPES, EVENT_CONFIG } = require('../config/eventConfig');
const { uploadToIPFS } = require('../utils/pinataUtils');
const path = require('path');
const fs = require('fs').promises;

/**
 * Validates event metadata structure
 * @param {Object} metadata The metadata object to validate
 * @throws {Error} If metadata is invalid
 */
function validateEventMetadata(metadata) {
    const requiredFields = ['name', 'description', 'image'];
    const missingFields = requiredFields.filter(field => !metadata[field]);
    
    if (missingFields.length > 0) {
        throw new Error(`Missing required metadata fields: ${missingFields.join(', ')}`);
    }

    if (!metadata.attributes || !Array.isArray(metadata.attributes)) {
        throw new Error('Metadata must include attributes array');
    }

    const requiredAttributes = ['Type', 'Capacity', 'Price'];
    const attributeTypes = metadata.attributes.map(attr => attr.trait_type);
    const missingAttributes = requiredAttributes.filter(
        attr => !attributeTypes.includes(attr)
    );

    if (missingAttributes.length > 0) {
        throw new Error(`Missing required attributes: ${missingAttributes.join(', ')}`);
    }
}

/**
 * Generates metadata for an event
 * @param {Object} event Event details
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Generated metadata
 */
async function generateEventMetadata(event, options = {}) {
    const metadata = {
        name: event.name,
        description: options.description || `${event.name} - A WaveX Event`,
        image: options.image || "ipfs://QmDefaultEventImageHash",
        attributes: [
            {
                trait_type: "Type",
                value: Object.keys(EVENT_TYPES)[event.eventType] || 'STANDARD'
            },
            {
                trait_type: "Capacity",
                value: event.capacity.toString()
            },
            {
                trait_type: "Price",
                value: event.price.toString()
            },
            {
                trait_type: "Status",
                value: event.active ? "Active" : "Inactive"
            },
            ...(options.attributes || [])
        ],
        properties: {
            eventId: event.id,
            createdAt: new Date().toISOString(),
            ...(options.properties || {})
        }
    };

    // Validate metadata
    validateEventMetadata(metadata);
    return metadata;
}

/**
 * Saves event metadata to local storage and IPFS
 * @param {string|number} eventId Event ID
 * @param {Object} metadata Event metadata
 * @returns {Promise<string>} IPFS URI of uploaded metadata
 */
async function saveEventMetadata(eventId, metadata) {
    try {
        // Validate metadata first
        validateEventMetadata(metadata);

        // Ensure metadata directory exists
        const metadataDir = path.join(process.cwd(), EVENT_CONFIG.metadataPath);
        await fs.mkdir(metadataDir, { recursive: true });

        // Save metadata locally
        const localPath = path.join(metadataDir, `${eventId}.json`);
        await fs.writeFile(localPath, JSON.stringify(metadata, null, 2));

        // Upload to IPFS
        const ipfsHash = await uploadToIPFS(JSON.stringify(metadata));
        console.log(`Metadata saved for event ${eventId}. IPFS hash: ${ipfsHash}`);

        return `ipfs://${ipfsHash}`;
    } catch (error) {
        console.error("Error saving event metadata:", error);
        throw error;
    }
}

/**
 * Updates existing event metadata
 * @param {string|number} eventId Event ID
 * @param {Object} updates Metadata updates
 * @returns {Promise<string>} New IPFS URI
 */
async function updateEventMetadata(eventId, updates) {
    try {
        // Get existing metadata
        const metadataPath = path.join(
            process.cwd(),
            EVENT_CONFIG.metadataPath,
            `${eventId}.json`
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
        return await saveEventMetadata(eventId, updatedMetadata);
    } catch (error) {
        console.error("Error updating event metadata:", error);
        throw error;
    }
}

module.exports = {
    generateEventMetadata,
    validateEventMetadata,
    saveEventMetadata,
    updateEventMetadata
};