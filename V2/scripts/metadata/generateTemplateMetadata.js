const fs = require("fs");
const path = require("path");

function formatDate(months) {
    const date = new Date();
    date.setMonth(date.getMonth() + parseInt(months));
    return date.toISOString();
}

async function main() {
    console.log("Starting template metadata generation...");
    
    // Load template configurations
    const configPath = path.join(process.cwd(), "V2", "config", "templates.json");
    const templateConfigs = JSON.parse(fs.readFileSync(configPath, "utf8")).templates;
    
    // Create output directory
    const outputDir = path.join(process.cwd(), "V2", "metadata", "templates");
    fs.mkdirSync(outputDir, { recursive: true });

    for (const [id, config] of Object.entries(templateConfigs)) {
        console.log(`\nGenerating metadata for ${config.name} template (ID: ${id})`);
        
        try {
            // Generate metadata for each platform
            const metadata = {};

            // OpenSea metadata
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
                        value: formatDate(config.validity)
                    }
                ]
            };

            // NFT Visual metadata
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

            // Save metadata
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
