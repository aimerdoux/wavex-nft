// scripts/config/templateConfig.js
const hre = require("hardhat");
const { validateMetadata } = require('../utils/configValidator');

// Base template configurations
const TEMPLATE_BASE = {
    GOLD: {
        id: 1,
        name: "Gold",
        baseBalance: "20",
        price: "20",
        discount: 0,
        isVIP: false,
        design: {
            image: "ipfs://QmGoldTemplateHash",
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
        id: 2,
        name: "Platinum",
        baseBalance: "50",
        price: "50",
        discount: 5,
        isVIP: false,
        design: {
            image: "ipfs://QmPlatinumTemplateHash",
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
    BLACK: {
        id: 3,
        name: "Black",
        baseBalance: "100",
        price: "100",
        discount: 10,
        isVIP: true,
        design: {
            image: "ipfs://QmBlackTemplateHash",
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
    EVENTBRITE: {
        id: 4,
        name: "EventBrite",
        baseBalance: "0",
        price: "0",
        discount: 0,
        isVIP: false,
        design: {
            image: "ipfs://QmEventBriteTemplateHash",
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

        // Generate complete metadata
        const metadata = {
            name: `WaveX ${template.name} Membership`,
            description: `WaveX ${template.name} Membership Card - ${template.benefits.length} exclusive benefits`,
            image: template.design.image,
            attributes: [
                {
                    trait_type: "Membership Tier",
                    value: template.name
                },
                {
                    trait_type: "Base Balance",
                    value: `${template.baseBalance} MATIC`
                },
                {
                    trait_type: "VIP Status",
                    value: template.isVIP ? "VIP" : "Standard"
                }
            ],
            properties: {
                tier: template.name,
                benefits: template.benefits,
                cardDesign: "v2",
                baseBalance: template.baseBalance,
                price: template.price,
                discount: template.discount,
                isVIP: template.isVIP,
                design: template.design
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
    if (isNaN(templateId) || !Number.isInteger(templateId)) {
        throw new Error("Invalid templateId - must be an integer");
    }
    const templateName = Object.keys(TEMPLATE_BASE).find(
        key => TEMPLATE_BASE[key].id === templateId
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