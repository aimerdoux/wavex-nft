const hre = require('hardhat');
const { generateMetadata } = require('../scripts/templates/templateMetadata');

async function main() {
    const templates = [
        {
            id: '1',
            name: 'Black',
            discount: '0'
        },
        {
            id: '2',
            name: 'Gold',
            discount: '6'
        },
        {
            id: '3',
            name: 'Platinum',
            discount: '12'
        },
        {
            id: '4',
            name: 'Custom',
            discount: '0'
        }
    ];

    console.log('Starting template metadata generation...');

    for (const template of templates) {
        console.log(\nGenerating metadata for  template (ID: ));
        
        process.env.TEMPLATE_ID = template.id;
        process.env.METADATA_OUTPUT_DIR = 'metadata/templates';
        
        try {
            await generateMetadata(
                template.id,
                undefined,
                {
                    output: process.env.METADATA_OUTPUT_DIR,
                    uploadToIPFS: false,
                    includeTokenData: false
                }
            );
            console.log(✅  template metadata generated successfully);
        } catch (error) {
            console.error(❌ Error generating  template metadata:, error);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
