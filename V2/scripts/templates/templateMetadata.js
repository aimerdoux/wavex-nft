const hre = require("hardhat");
require('dotenv').config({ path: 'V2.env' });
const { uploadToIPFS } = require('../utils/pinataUtils');
const path = require('path');
const fs = require('fs');
const { getTemplateConfig } = require('../config/templateConfig'); // Added import

// Metadata templates for different platforms
const METADATA_TEMPLATES = {
    opensea: {
        name: "WaveX NFT #{id}",
        description: "WaveX Luxury Experience NFT - Access exclusive benefits and experiences",
        image: "", // Will be set dynamically
        external_url: "https://wavex.com/nft/{id}",
        attributes: []
    },
    prepaidCard: {
        name: "WaveX Prepaid Card #{id}",
        cardNetwork: "VISA",
        cardProduct: "WaveX {template}",
        maskedNumber: "****-****-****-0000",
        expirationDate: "", // Will be set dynamically
        cardStatus: "ACTIVE",
        balanceTracking: {
            currentBalance: "0.00",
            currency: "USD",
            lastUpdated: ""
        },
        securityFeatures: {
            tokenized: true,
            secureElement: true,
            contactless: true
        },
        cardDesign: {
            template: "",
            primaryColor: "",
            textColor: ""
        }
    },
    nftVisual: {
        name: "WaveX Card #{id}",
        description: "WaveX {template} Membership Card",
        image: "", // Will be set dynamically
        attributes: [],
        properties: {
            tier: "",
            benefits: [],
            cardDesign: "v2",
            wavexBalance: "0.0",
            events: []
        }
    },
    appleWallet: {
        formatVersion: 1,
        storeCard: {
            auxiliaryFields: [
                {
                    key: "expiry",
                    label: "Expires",
                    value: "" // Will be set dynamically
                }
            ],
            backFields: [
                {
                    key: "benefits",
                    label: "Benefits",
                    value: "" // Will be set dynamically
                },
                {
                    key: "events",
                    label: "Active Events",
                    value: "" // Will be set dynamically
                }
            ],
            primaryFields: [
                {
                    key: "balance",
                    label: "WaveX Balance",
                    value: "0.00",
                    currencyCode: "WAVEX"
                }
            ],
            secondaryFields: [
                {
                    key: "membership",
                    label: "Membership",
                    value: ""
                },
                {
                    key: "cardType",
                    label: "Card Type",
                    value: "VISA"
                }
            ]
        },
        passTypeIdentifier: "pass.com.wavex.nft",
        teamIdentifier: "JHQFQ72XMR",
        organizationName: "WaveX",
        backgroundColor: "rgb(48, 48, 48)",
        foregroundColor: "rgb(255, 255, 255)",
        labelColor: "rgb(255, 255, 255)",
        logoText: "WaveX",
        serialNumber: "", // Will be set dynamically
        description: "WaveX Membership Card"
    }
};

const TEMPLATE_COLORS = {
    GOLD: {
        primary: "#FFD700",
        text: "#000000"
    },
    PLATINUM: {
        primary: "#E5E4E2",
        text: "#000000"
    },
    BLACK: {
        primary: "#000000",
        text: "#FFFFFF"
    },
    EVENTBRITE: {
        primary: "#FF6B6B",
        text: "#FFFFFF"
    }
};

async function generateMetadata(templateId, tokenId = "template", options = {}) {
    try {
        // Get contract and template details
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);
        
        const template = await wavexNFT.templates(templateId);
        const templateName = template.name.toUpperCase();
        const baseBalance = hre.ethers.formatEther(template.baseBalance);

        // Ensure tokenId is a string for string operations
        const formattedTokenId = tokenId.toString();

        // Get template config
        const templateConfig = getTemplateConfig(templateId);
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + parseInt(templateConfig.validity));

        // Generate metadata for each platform
        const metadata = {};

        // OpenSea metadata
        metadata.opensea = {
            ...METADATA_TEMPLATES.opensea,
            name: METADATA_TEMPLATES.opensea.name.replace('{id}', formattedTokenId),
            external_url: METADATA_TEMPLATES.opensea.external_url.replace('{id}', formattedTokenId),
            image: templateConfig.cardDesign.image,
            attributes: [
                {
                    trait_type: "Membership Tier",
                    value: templateName
                },
                {
                    trait_type: "WaveX Balance",
                    value: baseBalance
                },
                {
                    trait_type: "Valid Until",
                    value: expirationDate.toISOString().split('T')[0]
                }
            ]
        };

        // Prepaid Card metadata
        metadata.prepaidCard = {
            ...METADATA_TEMPLATES.prepaidCard,
            name: METADATA_TEMPLATES.prepaidCard.name.replace('{id}', formattedTokenId),
            cardProduct: METADATA_TEMPLATES.prepaidCard.cardProduct.replace('{template}', templateName),
            expirationDate: expirationDate.toISOString(),
            balanceTracking: {
                ...METADATA_TEMPLATES.prepaidCard.balanceTracking,
                currentBalance: baseBalance,
                lastUpdated: new Date().toISOString()
            },
            cardDesign: {
                template: templateName.toLowerCase(),
                primaryColor: templateConfig.cardDesign.primaryColor,
                textColor: templateConfig.cardDesign.textColor
            }
        };

        // NFT Visual metadata
        metadata.nftVisual = {
            ...METADATA_TEMPLATES.nftVisual,
            name: METADATA_TEMPLATES.nftVisual.name.replace('{id}', formattedTokenId),
            description: METADATA_TEMPLATES.nftVisual.description.replace('{template}', templateName),
            image: templateConfig.cardDesign.image,
            attributes: [
                {
                    trait_type: "Membership Tier",
                    value: templateName
                },
                {
                    trait_type: "WaveX Balance",
                    value: baseBalance
                },
                {
                    trait_type: "Issue Date",
                    value: new Date().toISOString()
                }
            ],
            properties: {
                ...METADATA_TEMPLATES.nftVisual.properties,
                tier: templateName,
                benefits: templateConfig.benefits,
                wavexBalance: baseBalance,
                events: []
            }
        };

        // Apple Wallet metadata
        metadata.appleWallet = {
            ...METADATA_TEMPLATES.appleWallet,
            serialNumber: `WAVEX-${formattedTokenId.padStart(6, '0')}`,
            storeCard: {
                ...METADATA_TEMPLATES.appleWallet.storeCard,
                primaryFields: [
                    {
                        key: "balance",
                        label: "WaveX Balance",
                        value: baseBalance,
                        currencyCode: "WAVEX"
                    }
                ],
                secondaryFields: [
                    {
                        key: "membership",
                        label: "Membership",
                        value: templateName
                    },
                    {
                        key: "cardType",
                        label: "Card Type",
                        value: "VISA"
                    }
                ],
                auxiliaryFields: [
                    {
                        key: "expiry",
                        label: "Expires",
                        value: `${expirationDate.getMonth() + 1}/${expirationDate.getFullYear()}`
                    }
                ],
                backFields: [
                    {
                        key: "benefits",
                        label: "Benefits",
                        value: templateConfig.benefits.join('\n')
                    },
                    {
                        key: "events",
                        label: "Active Events",
                        value: ""
                    }
                ]
            }
        };

        // Handle file output
        if (options.output) {
            const outputDir = path.join(process.cwd(), options.output);
            fs.mkdirSync(outputDir, { recursive: true });

            for (const [platform, data] of Object.entries(metadata)) {
                const filePath = path.join(outputDir, `${templateId}_${platform}.json`);
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            }
        }

        return metadata;
    } catch (error) {
        console.error("Error generating metadata:", error);
        throw error;
    }
}

async function main() {
    try {
        // Get configuration from environment variables
        const templateId = process.env.TEMPLATE_ID;
        if (!templateId) {
            throw new Error("TEMPLATE_ID is required");
        }

        const outputDir = process.env.METADATA_OUTPUT_DIR || 'templates';
        const uploadToIPFS = process.env.UPLOAD_TO_IPFS === "true";
        const includeTokenData = process.env.INCLUDE_TOKEN_DATA === "true";
        const platform = process.env.METADATA_PLATFORM || "all";

        console.log("\nGenerating metadata with the following configuration:");
        console.log("=================================================");
        console.log("Template ID:", templateId);
        console.log("Platform:", platform);
        console.log("Output Directory:", outputDir);
        console.log("Upload to IPFS:", uploadToIPFS);
        console.log("Include Token Data:", includeTokenData);
        console.log("=================================================\n");

        const metadata = await generateMetadata(
            templateId,
            undefined, // Don't pass tokenId for template generation
            {
                output: outputDir,
                uploadToIPFS,
                includeTokenData,
                platform
            }
        );

        // Output results
        if (platform !== "all" && metadata[platform]) {
            console.log(JSON.stringify(metadata[platform], null, 2));
        } else {
            console.log(JSON.stringify(metadata, null, 2));
        }

        if (uploadToIPFS) {
            console.log("\nIPFS Hashes:");
            console.log("============");
            Object.entries(metadata.ipfsHashes).forEach(([platform, hash]) => {
                console.log(`${platform}: ${hash}`);
            });
        }

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    generateMetadata,
    METADATA_TEMPLATES
};