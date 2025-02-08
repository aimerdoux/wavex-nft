// scripts/metadata/uploadToIPFS.js
const { uploadToIPFS: pinataUpload } = require('../utils/pinataUtils');
const path = require('path');
const fs = require('fs').promises;
const { validateMetadata } = require('./validateMetadata');

/**
 * Uploads content to IPFS with metadata
 * @param {Object} params Upload parameters
 * @param {string|Buffer} params.content Content to upload
 * @param {string} params.type Content type ('metadata', 'image', 'other')
 * @param {Object} params.metadata Additional metadata for the upload
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Upload result
 */
async function uploadToIPFS(params, options = {}) {
    try {
        if (!params.content) {
            throw new Error("Content is required");
        }

        // Prepare metadata for IPFS
        const pinataMetadata = {
            name: params.metadata?.name || `WaveX ${params.type || 'Asset'}`,
            keyvalues: {
                type: params.type || 'other',
                timestamp: new Date().toISOString(),
                ...params.metadata
            }
        };

        // Handle different content types
        let content = params.content;
        if (typeof content === 'object' && !Buffer.isBuffer(content)) {
            // If content is an object (like metadata), stringify it
            if (params.type === 'metadata') {
                // Validate metadata before upload
                const validationResult = validateMetadata(content, content.properties?.type || 'NFT');
                if (!validationResult.valid && !options.skipValidation) {
                    throw new Error(
                        `Invalid metadata: ${validationResult.errors.join(', ')}`
                    );
                }
            }
            content = JSON.stringify(content, null, 2);
        }

        // Upload to IPFS
        console.log(`Uploading ${params.type || 'content'} to IPFS...`);
        const ipfsHash = await pinataUpload(content);

        // Save upload record if tracking is enabled
        if (options.track) {
            await trackUpload({
                hash: ipfsHash,
                type: params.type,
                metadata: pinataMetadata,
                timestamp: new Date().toISOString()
            });
        }

        return {
            hash: ipfsHash,
            uri: `ipfs://${ipfsHash}`,
            type: params.type,
            metadata: pinataMetadata,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error("Error uploading to IPFS:", error);
        throw error;
    }
}

/**
 * Tracks IPFS uploads for future reference
 * @private
 */
async function trackUpload(uploadData) {
    try {
        const uploadsDir = path.join(process.cwd(), 'data/ipfs');
        await fs.mkdir(uploadsDir, { recursive: true });

        const trackingFile = path.join(uploadsDir, 'uploads.json');
        let uploads = [];

        try {
            const data = await fs.readFile(trackingFile, 'utf8');
            uploads = JSON.parse(data);
        } catch (error) {
            // File doesn't exist or is invalid, start with empty array
        }

        uploads.push(uploadData);

        await fs.writeFile(
            trackingFile,
            JSON.stringify(uploads, null, 2)
        );
    } catch (error) {
        console.warn("Failed to track upload:", error);
        // Don't throw error as this is non-critical
    }
}

/**
 * Batch uploads multiple items to IPFS
 * @param {Array<Object>} items Array of upload items
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Batch upload results
 */
async function batchUploadToIPFS(items, options = {}) {
    try {
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("At least one item is required");
        }

        const results = await Promise.allSettled(
            items.map(item =>
                uploadToIPFS(item, options)
                    .then(result => ({
                        content: item.metadata?.name || 'Unknown',
                        success: true,
                        details: result
                    }))
                    .catch(error => ({
                        content: item.metadata?.name || 'Unknown',
                        success: false,
                        error: error.message
                    }))
            )
        );

        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);

        return {
            totalUploads: items.length,
            successfulUploads: successful.length,
            failedUploads: results.length - successful.length,
            timestamp: new Date().toISOString(),
            results: results.map(r => 
                r.status === 'fulfilled' ? r.value : {
                    content: r.reason.content,
                    success: false,
                    error: r.reason.message
                }
            )
        };

    } catch (error) {
        console.error("Error in batch upload:", error);
        throw error;
    }
}

/**
 * Retrieves IPFS upload history
 * @param {Object} options Filter options
 * @returns {Promise<Array>} Upload history
 */
async function getUploadHistory(options = {}) {
    try {
        const uploadsDir = path.join(process.cwd(), 'data/ipfs');
        const trackingFile = path.join(uploadsDir, 'uploads.json');

        let uploads = [];
        try {
            const data = await fs.readFile(trackingFile, 'utf8');
            uploads = JSON.parse(data);
        } catch (error) {
            return [];
        }

        // Apply filters
        if (options.type) {
            uploads = uploads.filter(u => u.type === options.type);
        }
        if (options.since) {
            uploads = uploads.filter(u => 
                new Date(u.timestamp) >= new Date(options.since)
            );
        }

        return uploads;

    } catch (error) {
        console.error("Error retrieving upload history:", error);
        throw error;
    }
}

module.exports = {
    uploadToIPFS,
    batchUploadToIPFS,
    getUploadHistory
};