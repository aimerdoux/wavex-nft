// scripts/metadata/validateAndUpdate.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const PinataManager = require('../utils/pinataUtils');
require('dotenv').config();

const METADATA_TYPES = {
    nft_visual: {
        required: ['name', 'description', 'image', 'attributes'],
        optional: ['external_url', 'background_color']
    },
    prepaid_card: {
        required: ['cardNetwork', 'cardProduct', 'maskedNumber', 'expirationDate'],
        optional: ['cardStatus', 'balanceTracking']
    },
    apple_wallet: {
        required: ['formatVersion', 'passTypeIdentifier', 'serialNumber', 'description'],
        optional: ['logoText', 'foregroundColor', 'backgroundColor']
    }
};

async function fetchAndValidateMetadata(url, type) {
    try {
        const response = await axios.get(url);
        const metadata = response.data;
        
        console.log(`\nValidating ${type} metadata:`);
        const required = METADATA_TYPES[type].required;
        const missing = required.filter(field => !metadata[field]);
        
        if (missing.length > 0) {
            console.log(`Missing required fields: ${missing.join(', ')}`);
            return { valid: false, metadata, missing };
        }

        console.log('All required fields present');
        return { valid: true, metadata };
    } catch (error) {
        console.error(`Error fetching metadata from ${url}:`, error.message);
        return { valid: false, error: error.message };
    }
}

async function updateMetadataWithImages(metadata, cardDesignUrls) {
    // Update NFT visual metadata with card design image
    if (metadata.nft_visual) {
        metadata.nft_visual.image = cardDesignUrls[metadata.nft_visual.attributes.find(
            attr => attr.trait_type === "Membership Tier"
        )?.value || "GOLD"].toLowerCase();
    }

    // Update prepaid card metadata
    if (metadata.prepaid_card) {
        metadata.prepaid_card.cardDesign = {
            image: cardDesignUrls[metadata.prepaid_card.cardProduct.split(' ')[1]],
            version: "v1"
        };
    }

    // Update Apple Wallet metadata
    if (metadata.apple_wallet) {
        metadata.apple_wallet.cardImage = cardDesignUrls[
            metadata.apple_wallet.generic?.secondaryFields?.find(
                field => field.key === "membership"
            )?.value || "GOLD"
        ];
    }

    return metadata;
}

async function main() {
    try {
        console.log("Starting metadata validation and update process...");

        // Read the local metadata index
        const metadataDir = path.join(__dirname, '../../metadata');
        const indexPath = path.join(metadataDir, 'index', '1.json');
        
        if (!fs.existsSync(indexPath)) {
            throw new Error("Metadata index not found. Please generate metadata first.");
        }

        const localIndex = JSON.parse(fs.readFileSync(indexPath));
        const results = {};

        // Validate each metadata type
        for (const [type, data] of Object.entries(localIndex.metadata)) {
            const validation = await fetchAndValidateMetadata(data.url, type);
            results[type] = validation;
        }

        // Check if card designs are uploaded
        const designsIndexPath = path.join(__dirname, '../../assets/card-designs/card-designs-index.json');
        let cardDesignUrls = {};
        
        if (fs.existsSync(designsIndexPath)) {
            const designsIndex = JSON.parse(fs.readFileSync(designsIndexPath));
            cardDesignUrls = Object.entries(designsIndex).reduce((acc, [tier, data]) => {
                acc[tier] = data.ipfsUrl;
                return acc;
            }, {});
        }

        // Update metadata with card design images if available
        if (Object.keys(cardDesignUrls).length > 0) {
            console.log("\nUpdating metadata with card design images...");
            
            const updatedMetadata = updateMetadataWithImages(
                results,
                cardDesignUrls
            );

            // Upload updated metadata
            const pinata = new PinataManager(
                process.env.PINATA_API_KEY,
                process.env.PINATA_API_SECRET,
                process.env.PINATA_JWT
            );

            for (const [type, data] of Object.entries(updatedMetadata)) {
                if (data.valid && data.metadata) {
                    console.log(`\nUploading updated ${type} metadata...`);
                    const result = await pinata.uploadJSON(
                        data.metadata,
                        `wavex-${type}-1-updated`
                    );
                    console.log(`New IPFS Hash: ${result.IpfsHash}`);
                    console.log(`New URL: ${result.url}`);
                    results[type].updated = result;
                }
            }
        }

        console.log("\nValidation Summary:");
        console.log("===================");
        console.log(JSON.stringify(results, null, 2));

        return results;

    } catch (error) {
        console.error("\nError in validation process:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    fetchAndValidateMetadata,
    updateMetadataWithImages
};