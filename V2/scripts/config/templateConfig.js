// scripts/config/templateConfig.js
const hre = require("hardhat");
const { validateMetadata } = require('../utils/configValidator');

// Base template configurations
const TEMPLATE_BASE = {
    BLACK: {
        id: 1,
        name: "BLACK",
        baseBalance: "5000",
        price: "5000",
        discount: 0,
        isVIP: true,
        design: {
            image: "ipfs://QmY6qhAMnc2USJB6b3QxL3sYLnofoyXdr8aN3KAqDkvpms",
            backgroundColor: "rgb(0, 0, 0)",
            foregroundColor: "rgb(255, 255, 255)",
            labelColor: "rgb(255, 255, 255)",
            primaryColor: "#000000",
            textColor: "#FFFFFF"
        },
        benefits: [
            "Infinite VIP Access",
            "Personal Concierge",
            "Priority Everything",
            "Maximum Rewards",
            "Exclusive Events",
            "Private Experiences"
        ]
    },
    GOLD: {
        id: 2,
        name: "GOLD",
        baseBalance: "2000",
        price: "2000",
        discount: 6,
        isVIP: true,
        design: {
            image: "ipfs://QmZ8u69Hjwuxe7XSB4p344DaCtPoHAu9D6v3QE6cnggLRD",
            backgroundColor: "rgb(255, 215, 0)",
            foregroundColor: "rgb(0, 0, 0)",
            labelColor: "rgb(0, 0, 0)",
            primaryColor: "#FFD700",
            textColor: "#000000"
        },
        benefits: [
            "VIP Access",
            "Premium Support",
            "Event Discounts",
            "Merchant Rewards"
        ]
    },
    PLATINUM: {
        id: 3,
        name: "PLATINUM",
        baseBalance: "3500",
        price: "3500",
        discount: 12,
        isVIP: true,
        design: {
            image: "ipfs://QmVSqUndoMDubugAGMUtyzXyxNH8TjT9w5PAWWCHnjmQnj",
            backgroundColor: "rgb(229, 228, 226)",
            foregroundColor: "rgb(0, 0, 0)",
            labelColor: "rgb(0, 0, 0)",
            primaryColor: "#E5E4E2",
            textColor: "#000000"
        },
        benefits: [
            "Ultra VIP Access",
            "24/7 Concierge",
            "Priority Event Booking",
            "Enhanced Merchant Rewards",
            "Exclusive Experiences",
            "Cashback"
        ]
    },
    EVENTBRITE: {
        id: 4,
        name: "EVENTBRITE",
        baseBalance: "0",
        price: "0",
        discount: 0,
        isVIP: false,
        design: {
            image: "ipfs://QmY328jAjbgFvQLD1yuauCUAxyiQT8kEdtZzde1Xy2QkPb",
            backgroundColor: "rgb(255, 107, 107)",
            foregroundColor: "rgb(255, 255, 255)",
            labelColor: "rgb(255, 255, 255)",
            primaryColor: "#FF6B6B",
            textColor: "#FFFFFF"
        },
        benefits: [
            "Event Access",
            "Event Rewards"
        ]
    }
};

// Standard metadata fields
const STANDARD_METADATA = {
    passTypeIdentifier: "pass.com.wavex.nft",
    teamIdentifier: "JHQFQ72XMR",
    organizationName: "WaveX",
    logoText: "WaveX",
    cardNetwork: "VISA",
    formatVersion: 1,
    external_url: "https://wavex.com/nft/"
};

async function getTemplateMetadata(templateId, tokenId = "template") {
    try {
        // Get template base configuration
        const templateName = Object.keys(TEMPLATE_BASE).find(
            key => TEMPLATE_BASE[key].id === parseInt(templateId)
        );
        
        if (!templateName) {
            throw new Error(`Template ID ${templateId} not found`);
        }

        const template = TEMPLATE_BASE[templateName];

        // Get contract instance for on-chain data
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get token-specific data if not a template
        let tokenData = {};
        if (tokenId !== "template") {
            try {
                const balance = await wavexNFT.balanceOf(tokenId);
                const events = await wavexNFT.getTokenEvents(tokenId);
                const issueDate = await wavexNFT.getTokenIssueDate(tokenId);
                
                tokenData = {
                    balance: hre.ethers.formatEther(balance),
                    events: events || [],
                    issueDate: new Date(issueDate * 1000).toISOString()
                };
            } catch (error) {
                console.warn(`Warning: Could not fetch token data for ${tokenId}:`, error.message);
            }
        }

        // Calculate expiry date (2 years from now)
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 2);

        // Generate complete metadata
        const metadata = {
            onChainData: {
                templateId,
                name: template.name,
                baseBalance: template.baseBalance,
                price: template.price,
                discount: template.discount,
                isVIP: template.isVIP
            },
            
            appleWallet: {
                ...STANDARD_METADATA,
                storeCard: {
                    auxiliaryFields: [{
                        key: "expiry",
                        label: "Expires",
                        value: `${expiryDate.getMonth() + 1}/${expiryDate.getFullYear()}`
                    }],
                    backFields: [{
                        key: "benefits",
                        label: "Benefits",
                        value: template.benefits.join('\n')
                    }, {
                        key: "events",
                        label: "Active Events",
                        value: tokenData.events?.join('\n') || ""
                    }],
                    primaryFields: [{
                        key: "balance",
                        label: "WaveX Balance",
                        value: tokenData.balance || template.baseBalance,
                        currencyCode: "WAVEX USD"
                    }],
                    secondaryFields: [{
                        key: "membership",
                        label: "Membership",
                        value: template.name
                    }, {
                        key: "cardType",
                        label: "Card Type",
                        value: STANDARD_METADATA.cardNetwork
                    }]
                },
                ...template.design
            },

            nftVisual: {
                name: `WaveX Card #${tokenId}`,
                description: `WaveX ${template.name} Membership Card - ${template.benefits.length} exclusive benefits`,
                image: template.design.image,
                attributes: [
                    {
                        trait_type: "Membership Tier",
                        value: template.name
                    },
                    {
                        trait_type: "WaveX Balance",
                        value: tokenData.balance || template.baseBalance
                    },
                    {
                        trait_type: "Issue Date",
                        value: tokenData.issueDate || new Date().toISOString()
                    }
                ],
                properties: {
                    tier: template.name,
                    benefits: template.benefits,
                    cardDesign: "v2",
                    wavexBalance: tokenData.balance || template.baseBalance,
                    events: tokenData.events || []
                }
            },

            opensea: {
                name: `WaveX NFT #${tokenId}`,
                description: `WaveX ${template.name} Membership - Access exclusive benefits and experiences`,
                image: template.design.image,
                external_url: `${STANDARD_METADATA.external_url}${tokenId}`,
                attributes: [
                    {
                        trait_type: "Membership Tier",
                        value: template.name
                    },
                    {
                        trait_type: "WaveX Balance",
                        value: tokenData.balance || template.baseBalance
                    },
                    {
                        trait_type: "Valid Until",
                        value: expiryDate.toISOString().split('T')[0]
                    }
                ]
            }
        };

        // Validate metadata
        await validateMetadata(metadata);

        return metadata;
    } catch (error) {
        console.error("Error generating template metadata:", error);
        throw error;
    }
}

// Get base template configuration
function getTemplateBase(templateId) {
    const template = Object.values(TEMPLATE_BASE).find(t => t.id === parseInt(templateId));
    if (!template) {
        throw new Error(`Template ID ${templateId} not found`);
    }
    return template;
}

// Update template base configuration
function updateTemplateBase(templateId, updates) {
    const templateName = Object.keys(TEMPLATE_BASE).find(
        key => TEMPLATE_BASE[key].id === parseInt(templateId)
    );
    
    if (!templateName) {
        throw new Error(`Template ID ${templateId} not found`);
    }

    TEMPLATE_BASE[templateName] = {
        ...TEMPLATE_BASE[templateName],
        ...updates
    };

    return TEMPLATE_BASE[templateName];
}

module.exports = {
    getTemplateMetadata,
    getTemplateBase,
    updateTemplateBase,
    TEMPLATE_BASE,
    STANDARD_METADATA
};