// scripts/config/metadataConfig.js

const TEMPLATE_METADATA = {
    1: { // Gold
        name: "Gold",
        baseBalance: "20",
        price: "20",
        discount: 0,
        isVIP: false,
        metadata: {
            name: "WaveX Gold Membership",
            description: "Gold tier membership with exclusive benefits",
            image: "ipfs://QmGoldTemplateHash",
            attributes: [
                {
                    trait_type: "Tier",
                    value: "Gold"
                },
                {
                    trait_type: "Base Balance",
                    value: "20 MATIC"
                },
                {
                    trait_type: "VIP Status",
                    value: "Standard"
                }
            ]
        }
    },
    2: { // Platinum
        name: "Platinum",
        baseBalance: "50",
        price: "50",
        discount: 5,
        isVIP: false,
        metadata: {
            name: "WaveX Platinum Membership",
            description: "Platinum tier membership with premium benefits",
            image: "ipfs://QmPlatinumTemplateHash",
            attributes: [
                {
                    trait_type: "Tier",
                    value: "Platinum"
                },
                {
                    trait_type: "Base Balance",
                    value: "50 MATIC"
                },
                {
                    trait_type: "VIP Status",
                    value: "Standard"
                }
            ]
        }
    },
    3: { // Black
        name: "Black",
        baseBalance: "100",
        price: "100",
        discount: 10,
        isVIP: true,
        metadata: {
            name: "WaveX Black Membership",
            description: "Black tier membership with VIP benefits",
            image: "ipfs://QmBlackTemplateHash",
            attributes: [
                {
                    trait_type: "Tier",
                    value: "Black"
                },
                {
                    trait_type: "Base Balance",
                    value: "100 MATIC"
                },
                {
                    trait_type: "VIP Status",
                    value: "VIP"
                }
            ]
        }
    },
    4: { // EventBrite
        name: "EventBrite",
        baseBalance: "0",
        price: "0",
        discount: 0,
        isVIP: false,
        metadata: {
            name: "WaveX EventBrite Pass",
            description: "Special event access pass",
            image: "ipfs://QmEventBriteTemplateHash",
            attributes: [
                {
                    trait_type: "Type",
                    value: "Event Pass"
                },
                {
                    trait_type: "Base Balance",
                    value: "0 MATIC"
                },
                {
                    trait_type: "VIP Status",
                    value: "Standard"
                }
            ]
        }
    }
};

const STANDARD_CONFIG = {
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataApiSecret: process.env.PINATA_API_SECRET,
    pinataJWT: process.env.PINATA_JWT,
    metadataPath: "metadata/templates",
    templatePath: "data/templates",
    ipfsGateway: "https://gateway.pinata.cloud/ipfs/"
};

module.exports = {
    TEMPLATE_METADATA,
    STANDARD_CONFIG
};