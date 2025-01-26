// scripts/metadata/generateMetadata.js
const hre = require("hardhat");
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const PinataManager = require('../utils/pinataUtils');

// Metadata templates and configurations
const MetadataTemplates = {
    nft_visual: (tokenId, attributes) => ({
        name: `WaveX Card #${tokenId}`,
        description: `WaveX ${attributes.membershipTier} Membership Card`,
        image: attributes.imageUrl || `ipfs://${attributes.imageHash}`,
        attributes: [
            {
                trait_type: "Membership Tier",
                value: attributes.membershipTier
            },
            {
                trait_type: "Card Type",
                value: attributes.cardType
            },
            {
                trait_type: "Issue Date",
                value: new Date().toISOString()
            }
        ],
        properties: {
            tier: attributes.membershipTier,
            benefits: attributes.benefits || [],
            cardDesign: attributes.designVersion || "v1"
        }
    }),

    prepaid_card: (tokenId, attributes) => ({
        name: `WaveX Prepaid Card #${tokenId}`,
        cardNetwork: attributes.cardType,
        cardProduct: `WaveX ${attributes.membershipTier}`,
        maskedNumber: attributes.maskedPAN || "****-****-****-0000",
        expirationDate: attributes.expirationDate || "12/2025",
        cardStatus: "ACTIVE",
        balanceTracking: {
            currentBalance: "0.00",
            currency: "USD",
            lastUpdated: new Date().toISOString()
        },
        securityFeatures: {
            tokenized: true,
            secureElement: true,
            contactless: true
        },
        cardDesign: {
            template: attributes.membershipTier.toLowerCase(),
            primaryColor: attributes.cardColor || "#000000",
            textColor: "#FFFFFF"
        }
    }),

    apple_wallet: (tokenId, attributes) => ({
        formatVersion: 1,
        passTypeIdentifier: "pass.com.wavex.card",
        serialNumber: `WAVEX-${tokenId}`,
        description: `WaveX ${attributes.membershipTier} Card`,
        organizationName: "WaveX",
        logoText: "WaveX",
        foregroundColor: "rgb(255, 255, 255)",
        backgroundColor: attributes.membershipTier === "BLACK" ? "rgb(0, 0, 0)" : "rgb(48, 48, 48)",
        generic: {
            primaryFields: [
                {
                    key: "balance",
                    label: "BALANCE",
                    value: "$ 0.00",
                    currencyCode: "USD"
                }
            ],
            secondaryFields: [
                {
                    key: "membership",
                    label: "MEMBERSHIP",
                    value: attributes.membershipTier
                },
                {
                    key: "cardType",
                    label: "TYPE",
                    value: attributes.cardType
                }
            ],
            auxiliaryFields: [
                {
                    key: "expiry",
                    label: "EXPIRES",
                    value: attributes.expirationDate || "12/2025"
                }
            ],
            backFields: [
                {
                    key: "benefits",
                    label: "BENEFITS",
                    value: attributes.benefits?.join("\\n") || "No benefits assigned"
                }
            ]
        }
    })
};

async function generateMetadata(tokenId, attributes, metadataDir, pinata) {
    try {
        console.log(`\nGenerating metadata for Token ID: ${tokenId}`);
        const metadataTypes = Object.keys(MetadataTemplates);
        const results = {};

        // Generate and save metadata for each type
        for (const type of metadataTypes) {
            console.log(`\nProcessing ${type} metadata...`);
            
            // Generate metadata using template
            const metadata = MetadataTemplates[type](tokenId, attributes);
            
            // Create directory if it doesn't exist
            const typeDir = path.join(metadataDir, type);
            if (!fs.existsSync(typeDir)) {
                fs.mkdirSync(typeDir, { recursive: true });
            }

            // Save locally
            const filePath = path.join(typeDir, `${tokenId}.json`);
            fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
            console.log(`${type} metadata saved locally`);

            // Upload to Pinata if available
            if (pinata) {
                console.log(`Uploading ${type} metadata to IPFS...`);
                const pinataResponse = await pinata.uploadJSON(
                    metadata,
                    `wavex-${type}-${tokenId}`
                );
                console.log(`IPFS Hash: ${pinataResponse.IpfsHash}`);
                console.log(`IPFS URL: ${pinataResponse.url}`);
                
                results[type] = {
                    local: filePath,
                    ipfs: {
                        hash: pinataResponse.IpfsHash,
                        url: pinataResponse.url
                    }
                };
            } else {
                results[type] = {
                    local: filePath
                };
            }
        }

        // Create metadata index
        const metadataIndex = {
            tokenId,
            created: new Date().toISOString(),
            attributes,
            metadata: results
        };

        // Save index
        const indexDir = path.join(metadataDir, 'index');
        if (!fs.existsSync(indexDir)) {
            fs.mkdirSync(indexDir, { recursive: true });
        }
        fs.writeFileSync(
            path.join(indexDir, `${tokenId}.json`),
            JSON.stringify(metadataIndex, null, 2)
        );

        return metadataIndex;

    } catch (error) {
        console.error("Error generating metadata:", error);
        throw error;
    }
}

async function main() {
    try {
        // Validate environment variables
        const requiredEnvVars = ['TOKEN_ID', 'MEMBERSHIP_TIER', 'CARD_TYPE'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }

        // Initialize Pinata if credentials are available
        let pinata = null;
        if (process.env.PINATA_JWT) {
            pinata = new PinataManager(
                process.env.PINATA_API_KEY,
                process.env.PINATA_API_SECRET,
                process.env.PINATA_JWT
            );
            console.log("Pinata integration enabled");
        }

        // Prepare attributes
        const attributes = {
            tokenId: process.env.TOKEN_ID,
            membershipTier: process.env.MEMBERSHIP_TIER,
            cardType: process.env.CARD_TYPE,
            expirationDate: process.env.EXPIRATION_DATE || "12/2025",
            cardColor: process.env.CARD_COLOR,
            benefits: process.env.BENEFITS ? JSON.parse(process.env.BENEFITS) : [],
            imageHash: process.env.IMAGE_HASH,
            designVersion: process.env.DESIGN_VERSION || "v1"
        };

        // Generate metadata
        const metadataDir = path.join(__dirname, '../../metadata');
        console.log("\nStarting metadata generation process...");
        const result = await generateMetadata(
            attributes.tokenId,
            attributes,
            metadataDir,
            pinata
        );

        console.log("\nMetadata Generation Summary:");
        console.log("===========================");
        console.log(JSON.stringify(result, null, 2));

        return result;

    } catch (error) {
        console.error("\nError in metadata generation process:", error);
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
    generateMetadata,
    MetadataTemplates
};