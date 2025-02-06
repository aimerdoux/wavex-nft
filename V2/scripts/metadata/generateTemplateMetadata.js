const fs = require('fs');
const path = require('path');

function formatDate(months) {
    const date = new Date();
    date.setMonth(date.getMonth() + parseInt(months));
    return date.toISOString();
}

async function main() {
    console.log('Starting template metadata generation...');
    
    // Load template configurations
    const configPath = path.join(process.cwd(), 'V2', 'config', 'templates.json');
    const templateConfigs = JSON.parse(fs.readFileSync(configPath, 'utf8')).templates;
    
    // Create output directory
    const outputDir = path.join(process.cwd(), 'V2', 'metadata', 'templates');
    fs.mkdirSync(outputDir, { recursive: true });

    for (const [id, config] of Object.entries(templateConfigs)) {
        console.log(\\nGenerating metadata for \ template (ID: \)\);
        
        try {
            // Generate metadata for each platform
            const metadata = {};

            // OpenSea metadata
            metadata.opensea = {
                name: \WaveX \ Card\,
                description: \WaveX \ membership card with \% discount\,
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
                name: \WaveX \ Card\,
                description: \WaveX \ membership card\,
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
                    wavexBalance: config.baseBalance
                }
            };

            // Save metadata
            const filePath = path.join(outputDir, \\.json\);
            fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
            console.log(\✅ \ template metadata generated successfully\);
        } catch (error) {
            console.error(\❌ Error generating \ template metadata:\, error);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
