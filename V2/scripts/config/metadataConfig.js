// scripts/config/metadataConfig.js
const STANDARD_CONFIG = {
    passTypeIdentifier: "pass.com.wavex.nft",
    teamIdentifier: "JHQFQ72XMR",
    organizationName: "WaveX",
    logoText: "WaveX",
    cardNetwork: "VISA",
    formatVersion: 1,
    external_url: "https://wavex.com/nft/"
};

const TEMPLATE_METADATA = {
    1: { // GOLD
        name: "GOLD",
        benefits: [
            "VIP Access",
            "Premium Support",
            "Event Discounts",
            "Merchant Rewards"
        ],
        design: {
            image: "ipfs://QmZ8u69Hjwuxe7XSB4p344DaCtPoHAu9D6v3QE6cnggLRD",
            backgroundColor: "rgb(255, 215, 0)",
            foregroundColor: "rgb(0, 0, 0)",
            labelColor: "rgb(0, 0, 0)",
            primaryColor: "#FFD700",
            textColor: "#000000"
        },
        description: "WaveX Gold Membership - Premium benefits and exclusive access"
    },
    2: { // PLATINUM
        name: "PLATINUM",
        benefits: [
            "Ultra VIP Access",
            "24/7 Concierge",
            "Priority Event Booking",
            "Enhanced Merchant Rewards",
            "Exclusive Experiences",
            "Cashback",
            "Concierge 24/7"
        ],
        design: {
            image: "ipfs://QmYOURPLATINUMHASH",
            backgroundColor: "rgb(229, 228, 226)",
            foregroundColor: "rgb(0, 0, 0)",
            labelColor: "rgb(0, 0, 0)",
            primaryColor: "#E5E4E2",
            textColor: "#000000"
        },
        description: "WaveX Platinum Membership - Elite benefits and premier service"
    },
    // ... Similar for BLACK and EVENTBRITE
};

// scripts/config/templateConfig.js
const hre = require("hardhat");
const { TEMPLATE_METADATA, STANDARD_CONFIG } = require('./metadataConfig');

async function getTemplateMetadata(templateId, tokenId = "template") {
    try {
        // Get contract instance and on-chain data
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);
        
        // Get on-chain template data
        const template = await wavexNFT.getTemplate(templateId);
        
        // Get token-specific data if tokenId is provided
        let tokenData = {};
        if (tokenId !== "template") {
            const balance = await wavexNFT.balanceOf(tokenId);
            const events = await wavexNFT.getTokenEvents(tokenId);
            const issueDate = await wavexNFT.getTokenIssueDate(tokenId);
            
            tokenData = {
                balance: hre.ethers.formatEther(balance),
                events: events,
                issueDate: new Date(issueDate * 1000).toISOString()
            };
        }

        // Combine template metadata with on-chain data
        const templateConfig = TEMPLATE_METADATA[templateId];
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 24); // 2 years validity

        // Generate platform-specific metadata
        return {
            onChainData: {
                templateId,
                name: template[0],
                baseBalance: hre.ethers.formatEther(template[1]),
                price: hre.ethers.formatEther(template[2]),
                discount: template[3].toString(),
                isVIP: template[4],
                metadataURI: template[5],
                active: template[6]
            },
            
            appleWallet: {
                ...STANDARD_CONFIG,
                formatVersion: 1,
                storeCard: {
                    auxiliaryFields: [{
                        key: "expiry",
                        label: "Expires",
                        value: `${expiryDate.getMonth() + 1}/${expiryDate.getFullYear()}`
                    }],
                    backFields: [{
                        key: "benefits",
                        label: "Benefits",
                        value: templateConfig.benefits.join('\n')
                    }, {
                        key: "events",
                        label: "Active Events",
                        value: tokenData.events?.join('\n') || ""
                    }],
                    primaryFields: [{
                        key: "balance",
                        label: "WaveX Balance",
                        value: tokenData.balance || template[1],
                        currencyCode: "WAVEX"
                    }],
                    secondaryFields: [{
                        key: "membership",
                        label: "Membership",
                        value: templateConfig.name
                    }, {
                        key: "cardType",
                        label: "Card Type",
                        value: STANDARD_CONFIG.cardNetwork
                    }]
                },
                ...templateConfig.design
            },

            nftVisual: {
                name: `WaveX Card #${tokenId}`,
                description: templateConfig.description,
                image: templateConfig.design.image,
                attributes: [
                    {
                        trait_type: "Membership Tier",
                        value: templateConfig.name
                    },
                    {
                        trait_type: "WaveX Balance",
                        value: tokenData.balance || template[1]
                    },
                    {
                        trait_type: "Issue Date",
                        value: tokenData.issueDate || new Date().toISOString()
                    }
                ],
                properties: {
                    tier: templateConfig.name,
                    benefits: templateConfig.benefits,
                    cardDesign: "v2",
                    wavexBalance: tokenData.balance || template[1],
                    events: tokenData.events || []
                }
            },

            opensea: {
                name: `WaveX NFT #${tokenId}`,
                description: templateConfig.description,
                image: templateConfig.design.image,
                external_url: `${STANDARD_CONFIG.external_url}${tokenId}`,
                attributes: [
                    {
                        trait_type: "Membership Tier",
                        value: templateConfig.name
                    },
                    {
                        trait_type: "WaveX Balance",
                        value: tokenData.balance || template[1]
                    },
                    {
                        trait_type: "Valid Until",
                        value: expiryDate.toISOString().split('T')[0]
                    }
                ]
            }
        };
    } catch (error) {
        console.error("Error generating template metadata:", error);
        throw error;
    }
}

module.exports = {
    getTemplateMetadata,
    TEMPLATE_METADATA,
    STANDARD_CONFIG
};