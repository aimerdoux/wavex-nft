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

async function generateMetadata(templateId, tokenId, options = {}) {
    try {
        // Get contract and template details
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);
        
        const template = await wavexNFT.templates(templateId);
        const templateName = template.name.toUpperCase();
        const baseBalance = hre.ethers.formatEther(template.baseBalance);

        // Get template config
        const templateConfig = getTemplateConfig(templateId); // Added template config
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + parseInt(templateConfig.validity)); // Updated expiration logic

        // Get token balance and events if token exists
        let currentBalance = baseBalance;
        let tokenEvents = [];
        if (tokenId && options.includeTokenData) {
            try {
                currentBalance = hre.ethers.formatEther(await wavexNFT.tokenBalance(tokenId));
                tokenEvents = await wavexNFT.getTokenEvents(tokenId);
            } catch (error) {
                console.log("Token not minted yet, using template defaults");
            }
        }

        // Generate metadata for each platform
        const metadata = {};

        // OpenSea metadata
        metadata.opensea = {
            ...METADATA_TEMPLATES.opensea,
            name: METADATA_TEMPLATES.opensea.name.replace('{id}', tokenId),
            external_url: METADATA_TEMPLATES.opensea.external_url.replace('{id}', tokenId),
            image: templateConfig.cardDesign.image, // Updated with template config
            attributes: [
                {
                    trait_type: "Membership Tier",
                    value: templateName
                },
                {
                    trait_type: "WaveX Balance",
                    value: currentBalance
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
            name: METADATA_TEMPLATES.prepaidCard.name.replace('{id}', tokenId),
            cardProduct: METADATA_TEMPLATES.prepaidCard.cardProduct.replace('{template}', templateName),
            expirationDate: expirationDate.toISOString(),
            balanceTracking: {
                ...METADATA_TEMPLATES.prepaidCard.balanceTracking,
                currentBalance: currentBalance,
                lastUpdated: new Date().toISOString()
            },
            cardDesign: {
                template: templateName.toLowerCase(),
                primaryColor: templateConfig.cardDesign.primaryColor, // Updated with template config
                textColor: templateConfig.cardDesign.textColor // Updated with template config
            }
        };

        // NFT Visual metadata
        metadata.nftVisual = {
            ...METADATA_TEMPLATES.nftVisual,
            name: METADATA_TEMPLATES.nftVisual.name.replace('{id}', tokenId),
            description: METADATA_TEMPLATES.nftVisual.description.replace('{template}', templateName),
            image: templateConfig.cardDesign.image, // Updated with template config
            attributes: [
                {
                    trait_type: "Membership Tier",
                    value: templateName
                },
                {
                    trait_type: "WaveX Balance",
                    value: currentBalance
                },
                {
                    trait_type: "Issue Date",
                    value: new Date().toISOString()
                }
            ],
            properties: {
                ...METADATA_TEMPLATES.nftVisual.properties,
                tier: templateName,
                benefits: templateConfig.benefits, // Updated with template config
                wavexBalance: currentBalance,
                events: tokenEvents
            }
        };

        // Apple Wallet metadata
        metadata.appleWallet = {
            ...METADATA_TEMPLATES.appleWallet,
            serialNumber: `WAVEX-${tokenId.padStart(6, '0')}`,
            storeCard: {
                ...METADATA_TEMPLATES.appleWallet.storeCard,
                primaryFields: [
                    {
                        key: "balance",
                        label: "WaveX Balance",
                        value: currentBalance,
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
                        value: templateConfig.benefits.join('\n') // Updated with template config
                    },
                    {
                        key: "events",
                        label: "Active Events",
                        value: tokenEvents.join('\n')
                    }
                ]
            }
        };

        // Handle file output
        if (options.output) {
            const outputDir = path.join(process.cwd(), 'metadata', options.output);
            fs.mkdirSync(outputDir, { recursive: true });

            for (const [platform, data] of Object.entries(metadata)) {
                const filePath = path.join(outputDir, `${tokenId}_${platform}.json`);
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            }
        }

        // Upload to IPFS if requested
        if (options.uploadToIPFS) {
            const ipfsResults = {};
            for (const [platform, data] of Object.entries(metadata)) {
                const result = await uploadToIPFS(
                    JSON.stringify(data),
                    `${tokenId}_${platform}.json`
                );
                ipfsResults[platform] = result;
            }
            metadata.ipfsHashes = ipfsResults;
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
        const templateId = process.env.TEMPLATE_ID || process.env.TEMPLATE_GOLD_ID || "1";
        const tokenId = process.env.TOKEN_ID || "1";
        const platform = process.env.METADATA_PLATFORM || "all";
        const outputDir = process.env.METADATA_OUTPUT_DIR;
        const uploadToIPFS = process.env.UPLOAD_TO_IPFS === "true";
        const includeTokenData = process.env.INCLUDE_TOKEN_DATA === "true";

        console.log("\nGenerating metadata with the following configuration:");
        console.log("=================================================");
        console.log("Template ID:", templateId);
        console.log("Token ID:", tokenId);
        console.log("Platform:", platform);
        console.log("Output Directory:", outputDir || "None (console output only)");
        console.log("Upload to IPFS:", uploadToIPFS);
        console.log("Include Token Data:", includeTokenData);
        console.log("=================================================\n");

        const metadata = await generateMetadata(
            templateId,
            tokenId,
            {
                output: outputDir,
                uploadToIPFS,
                includeTokenData,
                platform
            }
        );

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