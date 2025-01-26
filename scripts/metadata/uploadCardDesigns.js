// scripts/metadata/uploadCardDesigns.js
const hre = require("hardhat");
const path = require('path');
const fs = require('fs');
const PinataManager = require('../utils/pinataUtils');
require('dotenv').config();

const CARD_DESIGNS = {
    BLACK: {
        filename: 'black.jpg',  // Changed to jpg
        description: 'WaveX Black Membership Card',
        attributes: {
            tier: 'BLACK',
            style: 'Circuit Dark',
            material: 'Premium Black Metal',
            features: ['Circuit Pattern', 'EMV Chip', 'NFC Enabled']
        }
    },
    PLATINUM: {
        filename: 'platinum.jpg',  // Changed to jpg
        description: 'WaveX Platinum Membership Card',
        attributes: {
            tier: 'PLATINUM',
            style: 'Circuit Silver',
            material: 'Metallic Platinum',
            features: ['Circuit Pattern', 'EMV Chip', 'NFC Enabled']
        }
    },
    GOLD: {
        filename: 'gold.jpg',  // Changed to jpg
        description: 'WaveX Gold Membership Card',
        attributes: {
            tier: 'GOLD',
            style: 'Circuit Gold',
            material: 'Premium Gold Metal',
            features: ['Circuit Pattern', 'EMV Chip', 'NFC Enabled']
        }
    }
};

async function saveBase64Image(base64String, filePath) {
    // Remove data:image/jpeg;base64, if present
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

async function uploadCardDesigns(pinata) {
    try {
        console.log("\nStarting card design uploads...");
        const results = {};
        const assetsDir = path.join(__dirname, '../../assets/card-designs');

        // Ensure assets directory exists
        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true });
        }

        for (const [tier, design] of Object.entries(CARD_DESIGNS)) {
            console.log(`\nProcessing ${tier} card design...`);
            const imagePath = path.join(assetsDir, tier.toLowerCase(), design.filename);
            
            // Ensure tier directory exists
            const tierDir = path.dirname(imagePath);
            if (!fs.existsSync(tierDir)) {
                fs.mkdirSync(tierDir, { recursive: true });
            }

            if (!fs.existsSync(imagePath)) {
                console.log(`Please save the ${tier} card image as: ${imagePath}`);
                continue;
            }

            // Upload image to Pinata
            console.log(`Uploading ${tier} card to Pinata...`);
            const uploadResult = await pinata.uploadFile(
                imagePath,
                `wavex-${tier.toLowerCase()}-card`
            );

            results[tier] = {
                ...design,
                ipfsHash: uploadResult.IpfsHash,
                ipfsUrl: uploadResult.url,
                pinSize: uploadResult.PinSize,
                localPath: imagePath
            };

            console.log(`${tier} card uploaded successfully`);
            console.log(`IPFS Hash: ${uploadResult.IpfsHash}`);
            console.log(`Gateway URL: ${uploadResult.url}`);
        }

        // Save results to a card designs index file
        const indexPath = path.join(assetsDir, 'card-designs-index.json');
        fs.writeFileSync(indexPath, JSON.stringify(results, null, 2));

        // Update environment variables suggestion
        if (Object.keys(results).length > 0) {
            console.log("\nAdd these variables to your .env file:");
            console.log("=======================================");
            for (const [tier, data] of Object.entries(results)) {
                console.log(`IMAGE_HASH_${tier}=${data.ipfsHash}`);
            }
        } else {
            console.log("\nNo images were uploaded. Please save your card images in:");
            console.log("===============================================");
            for (const [tier, design] of Object.entries(CARD_DESIGNS)) {
                console.log(`${tier}: assets/card-designs/${tier.toLowerCase()}/${design.filename}`);
            }
        }

        return results;

    } catch (error) {
        console.error("Error uploading card designs:", error);
        throw error;
    }
}

async function main() {
    try {
        // Initialize Pinata
        const pinata = new PinataManager(
            process.env.PINATA_API_KEY,
            process.env.PINATA_API_SECRET,
            process.env.PINATA_JWT
        );

        // Upload card designs
        const results = await uploadCardDesigns(pinata);

        console.log("\nCard Design Upload Summary:");
        console.log("==========================");
        console.log(JSON.stringify(results, null, 2));

        if (Object.keys(results).length > 0) {
            // Create a card designs manifest
            const manifest = {
                schemaVersion: "1.0.0",
                createdAt: new Date().toISOString(),
                designs: results
            };

            // Upload manifest to Pinata
            console.log("\nUploading card designs manifest...");
            const manifestResult = await pinata.uploadJSON(
                manifest,
                'wavex-card-designs-manifest'
            );

            console.log(`Manifest uploaded successfully`);
            console.log(`IPFS Hash: ${manifestResult.IpfsHash}`);
            console.log(`Gateway URL: ${manifestResult.url}`);
        }

        return {
            cardDesigns: results,
            manifest: Object.keys(results).length > 0 ? manifestResult : null
        };

    } catch (error) {
        console.error("\nError in upload process:", error);
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
    uploadCardDesigns,
    CARD_DESIGNS
};