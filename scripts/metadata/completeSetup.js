// scripts/metadata/completeSetup.js
const fs = require('fs');
const path = require('path');
const PinataManager = require('../utils/pinataUtils');
require('dotenv').config();

async function uploadCardImage(pinata, tier, imagePath) {
    try {
        console.log(`\nUploading ${tier} card design...`);
        const result = await pinata.uploadFile(
            imagePath,
            `wavex-${tier.toLowerCase()}-card-design`
        );
        console.log(`${tier} card uploaded successfully`);
        console.log(`IPFS Hash: ${result.IpfsHash}`);
        console.log(`URL: ${result.url}`);
        return result;
    } catch (error) {
        console.error(`Error uploading ${tier} card:`, error);
        throw error;
    }
}

async function updateMetadata(pinata, tokenId, cardImages) {
    try {
        // Read existing metadata
        const metadataDir = path.join(__dirname, '../../metadata');
        const types = ['nft_visual', 'prepaid_card', 'apple_wallet'];
        const updatedMetadata = {};

        for (const type of types) {
            const filePath = path.join(metadataDir, type, `${tokenId}.json`);
            if (!fs.existsSync(filePath)) {
                console.log(`Metadata file not found: ${filePath}`);
                continue;
            }

            const metadata = JSON.parse(fs.readFileSync(filePath));
            
            // Update image URLs based on metadata type
            if (type === 'nft_visual') {
                const tier = metadata.attributes.find(
                    attr => attr.trait_type === "Membership Tier"
                )?.value;
                metadata.image = `ipfs://${cardImages[tier]?.IpfsHash}`;
            } else if (type === 'prepaid_card') {
                const tier = metadata.cardProduct.split(' ')[1];
                metadata.cardDesign.imageUrl = `ipfs://${cardImages[tier]?.IpfsHash}`;
            } else if (type === 'apple_wallet') {
                const tier = metadata.generic.secondaryFields.find(
                    field => field.key === "membership"
                )?.value;
                metadata.cardImageUrl = `ipfs://${cardImages[tier]?.IpfsHash}`;
            }

            // Upload updated metadata
            console.log(`\nUploading updated ${type} metadata...`);
            const result = await pinata.uploadJSON(
                metadata,
                `wavex-${type}-${tokenId}-complete`
            );
            
            updatedMetadata[type] = {
                original: metadata,
                ipfsHash: result.IpfsHash,
                url: result.url
            };
        }

        // Create and upload metadata index
        const metadataIndex = {
            tokenId,
            timestamp: new Date().toISOString(),
            cardImages,
            metadata: updatedMetadata
        };

        // Save index locally
        const indexDir = path.join(metadataDir, 'index');
        if (!fs.existsSync(indexDir)) {
            fs.mkdirSync(indexDir, { recursive: true });
        }
        fs.writeFileSync(
            path.join(indexDir, `${tokenId}_complete.json`),
            JSON.stringify(metadataIndex, null, 2)
        );

        // Upload index to IPFS
        const indexResult = await pinata.uploadJSON(
            metadataIndex,
            `wavex-token-${tokenId}-complete-index`
        );

        return {
            metadataIndex,
            indexHash: indexResult.IpfsHash,
            indexUrl: indexResult.url
        };

    } catch (error) {
        console.error('Error updating metadata:', error);
        throw error;
    }
}

async function main() {
    try {
        console.log('Starting complete metadata setup...');

        // Initialize Pinata
        const pinata = new PinataManager(
            process.env.PINATA_API_KEY,
            process.env.PINATA_API_SECRET,
            process.env.PINATA_JWT
        );

        // Upload card designs
        const cardDesigns = [
            { tier: 'BLACK', path: 'assets/card-designs/black/black.jpg' },
            { tier: 'PLATINUM', path: 'assets/card-designs/platinum/platinum.jpg' },
            { tier: 'GOLD', path: 'assets/card-designs/gold/gold.jpg' }
        ];

        const cardImages = {};
        for (const design of cardDesigns) {
            const imagePath = path.join(__dirname, '../../', design.path);
            if (fs.existsSync(imagePath)) {
                cardImages[design.tier] = await uploadCardImage(pinata, design.tier, imagePath);
            } else {
                console.log(`Warning: Image not found at ${imagePath}`);
            }
        }

        // Update metadata with image links
        const tokenId = process.env.TOKEN_ID || "1";
        const result = await updateMetadata(pinata, tokenId, cardImages);

        console.log('\nComplete Metadata Setup Summary:');
        console.log('===============================');
        console.log(JSON.stringify(result, null, 2));

        // Print URLs for verification
        console.log('\nVerification URLs:');
        console.log('==================');
        console.log(`Complete Metadata Index: ${result.indexUrl}`);
        Object.entries(result.metadataIndex.metadata).forEach(([type, data]) => {
            console.log(`${type}: ${data.url}`);
        });

        return result;

    } catch (error) {
        console.error('\nError in complete setup:', error);
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
    uploadCardImage,
    updateMetadata
};