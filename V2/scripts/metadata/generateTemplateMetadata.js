const fs = require("fs");
const path = require("path");

function formatDate(months) {
    const date = new Date();
    date.setMonth(date.getMonth() + parseInt(months));
    return date.toISOString();
}

function getPassTypeIdentifier(templateId) {
    const prefixes = {
        "1": "pass.com.wavex.black",
        "2": "pass.com.wavex.gold",
        "3": "pass.com.wavex.platinum",
        "4": "pass.com.wavex.custom"
    };
    return prefixes[templateId] || "pass.com.wavex.default";
}

async function main() {
    console.log("Starting template metadata generation...");
    
    const configPath = path.join(process.cwd(), "V2", "config", "templates.json");
    const templateConfigs = JSON.parse(fs.readFileSync(configPath, "utf8")).templates;
    
    const outputDir = path.join(process.cwd(), "V2", "metadata", "templates");
    fs.mkdirSync(outputDir, { recursive: true });

    for (const [id, config] of Object.entries(templateConfigs)) {
        console.log(`\nGenerating metadata for ${config.name} template (ID: ${id})`);
        
        try {
            const metadata = {};
            const validUntil = formatDate(config.validity);

            // OpenSea metadata (unchanged)
            metadata.opensea = {
                name: `WaveX ${config.name} Card`,
                description: `WaveX ${config.name} membership card with ${config.discount}% discount`,
                image: config.cardDesign.image,
                attributes: [
                    {
                        trait_type: "Membership Tier",
                        value: config.name
                    },
                    {
                        trait_type: "WaveX Balance",
                        value: config.baseBalance
                    },
                    {
                        trait_type: "Valid Until",
                        value: validUntil
                    }
                ]
            };

            // NFT Visual metadata (unchanged)
            metadata.nftVisual = {
                name: `WaveX ${config.name} Card`,
                description: `WaveX ${config.name} membership card`,
                image: config.cardDesign.image,
                attributes: [
                    {
                        trait_type: "Membership Tier",
                        value: config.name
                    },
                    {
                        trait_type: "WaveX Balance",
                        value: config.baseBalance
                    }
                ],
                properties: {
                    tier: config.name,
                    benefits: config.benefits,
                    wavexBalance: config.baseBalance,
                    cardDesign: config.cardDesign
                }
            };

            // Apple Wallet pass metadata
            metadata.appleWallet = {
                formatVersion: 1,
                passTypeIdentifier: getPassTypeIdentifier(id),
                serialNumber: `TEMPLATE-${id}`,
                teamIdentifier: "WAVEX2024",
                organizationName: "WaveX",
                description: `WaveX ${config.name} Card`,
                logoText: "WaveX",
                foregroundColor: config.cardDesign.textColor,
                backgroundColor: config.cardDesign.primaryColor,
                storeCard: {
                    primaryFields: [
                        {
                            key: "balance",
                            label: "BALANCE",
                            value: config.baseBalance,
                            currencyCode: "USD"
                        }
                    ],
                    secondaryFields: [
                        {
                            key: "tier",
                            label: "TIER",
                            value: config.name
                        },
                        {
                            key: "discount",
                            label: "DISCOUNT",
                            value: `${config.discount}%`
                        }
                    ],
                    backFields: [
                        {
                            key: "validUntil",
                            label: "VALID UNTIL",
                            value: validUntil
                        },
                        ...config.benefits.map((benefit, index) => ({
                            key: `benefit${index}`,
                            label: "BENEFIT",
                            value: benefit
                        }))
                    ]
                }
            };

            // Prepaid Card metadata
            metadata.prepaidCard = {
                templateId: id,
                cardType: config.name,
                baseBalance: config.baseBalance,
                discount: config.discount,
                validUntil: validUntil,
                style: {
                    colors: {
                        primary: config.cardDesign.primaryColor,
                        text: config.cardDesign.textColor
                    },
                    image: config.cardDesign.image
                },
                features: {
                    benefits: config.benefits,
                    transferable: true,
                    rechargeable: true,
                    upgradeable: id !== "3" // Platinum cards cannot be upgraded
                }
            };

            const filePath = path.join(outputDir, `${id}.json`);
            fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
            console.log(`✅ ${config.name} template metadata generated successfully`);
        } catch (error) {
            console.error(`❌ Error generating ${config.name} template metadata:`, error);
        }
    }

    console.log("\n✨ All template metadata generated successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
