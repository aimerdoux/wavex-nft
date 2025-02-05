// scripts/config/templateConfig.js
const TEMPLATE_CONFIGS = {
    GOLD: {
        id: 1,
        name: "GOLD",
        baseBalance: "2000.0",
        cardDesign: {
            image: "ipfs://QmRNtUZctvatbPgb9yHmxd53cTfZbVNdmKyGEpRooUFW9X", // Add your GOLD card IPFS hash
            primaryColor: "#FFD700",
            textColor: "#000000"
        },
        benefits: [
            "VIP Access",
            "Premium Support",
            "Event Discounts",
            "Merchant Rewards"
        ],
        validity: "24" // months
    },
    PLATINUM: {
        id: 2,
        name: "PLATINUM",
        baseBalance: "5000.0",
        cardDesign: {
            image: "ipfs://QmYOURPLATINUMHASH", // Add your PLATINUM card IPFS hash
            primaryColor: "#E5E4E2",
            textColor: "#000000"
        },
        benefits: [
            "Ultra VIP Access",
            "24/7 Concierge",
            "Priority Event Booking",
            "Enhanced Merchant Rewards",
            "Exclusive Experiences"
        ],
        validity: "24"
    },
    BLACK: {
        id: 3,
        name: "BLACK",
        baseBalance: "10000.0",
        cardDesign: {
            image: "ipfs://QmYOURBLACKHASH", // Add your BLACK card IPFS hash
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
        ],
        validity: "36"
    },
    EVENTBRITE: {
        id: 4,
        name: "EVENTBRITE",
        baseBalance: "0.0", // Will be set based on event purchases
        cardDesign: {
            image: "ipfs://QmYOUREVENTBRITEHASH", // Add your EVENTBRITE card IPFS hash
            primaryColor: "#FF6B6B",
            textColor: "#FFFFFF"
        },
        benefits: [
            "Event Access",
            "Event Rewards"
        ],
        validity: "12"
    }
};

module.exports = {
    TEMPLATE_CONFIGS,
    getTemplateConfig: (templateId) => {
        const config = Object.values(TEMPLATE_CONFIGS).find(c => c.id === Number(templateId));
        if (!config) throw new Error(`Template ID ${templateId} not found`);
        return config;
    }
};