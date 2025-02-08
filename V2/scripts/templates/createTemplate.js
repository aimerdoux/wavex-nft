// scripts/templates/createTemplate.js
const hre = require("hardhat");
const { TEMPLATE_METADATA } = require('../config/metadataConfig');
const { getTemplateMetadata } = require('../config/templateConfig');
const { uploadToIPFS } = require('../utils/pinataUtils');
require('dotenv').config();

async function createTemplate(templateId, options = {}) {
    try {
        console.log(`\nCreating template ${templateId}...`);

        // Validate template exists in metadata config
        if (!TEMPLATE_METADATA[templateId]) {
            throw new Error(`Template ID ${templateId} not found in metadata configuration`);
        }

        const template = TEMPLATE_METADATA[templateId];
        console.log('Template configuration:', {
            name: template.name,
            baseBalance: template.baseBalance,
            price: template.price,
            discount: template.discount,
            isVIP: template.isVIP
        });

        // Generate metadata
        console.log('\nGenerating metadata...');
        const metadata = await getTemplateMetadata(templateId);

        // Handle metadata URI based on UPLOAD_TO_IPFS setting
        let metadataURI;
        if (process.env.UPLOAD_TO_IPFS === 'true') {
            console.log('Uploading metadata to IPFS...');
            metadataURI = await uploadToIPFS(JSON.stringify(metadata));
            console.log('Metadata uploaded to IPFS:', metadataURI);
        } else {
            console.log('IPFS upload disabled, using placeholder URI');
            metadataURI = `template-${templateId}`;
        }

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        if (!contractAddress) {
            throw new Error("WAVEX_NFT_V2_ADDRESS not found in environment");
        }
        console.log('\nContract address:', contractAddress);

        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get gas settings from network config
        const networkConfig = hre.config.networks[hre.network.name];
        console.log('\nUsing network gas settings:', {
            gasPrice: networkConfig.gasPrice ? hre.ethers.formatUnits(networkConfig.gasPrice, 'gwei') + ' gwei' : 'Not set',
            gasLimit: networkConfig.gasLimit || 'Not set'
        });

        const gasSettings = {
            gasPrice: networkConfig.gasPrice,
            gasLimit: networkConfig.gasLimit
        };

        // Create template on-chain using addTemplate
        console.log('\nSending transaction to create template...');
        const tx = await wavexNFT.addTemplate(
            templateId,
            template.name,
            hre.ethers.parseEther(template.baseBalance || "0"),
            hre.ethers.parseEther(template.price || "0"),
            template.discount || 0,
            template.isVIP || false,
            process.env.UPLOAD_TO_IPFS === 'true' ? `ipfs://${metadataURI}` : metadataURI,
            true, // active
            gasSettings
        );

        console.log('Transaction sent:', tx.hash);
        console.log('Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);
        
        // Verify template was created
        console.log('\nVerifying template creation...');
        const createdTemplate = await wavexNFT.getTemplate(templateId, gasSettings);
        console.log('Template verified:', {
            name: createdTemplate[0],
            baseBalance: hre.ethers.formatEther(createdTemplate[1]),
            price: hre.ethers.formatEther(createdTemplate[2]),
            discount: Number(createdTemplate[3]),
            isVIP: createdTemplate[4],
            metadataURI: createdTemplate[5],
            active: createdTemplate[6]
        });

        return {
            templateId,
            metadataURI,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber
        };

    } catch (error) {
        console.error("\nError creating template:");
        console.error('- Message:', error.message);
        console.error('- Stack:', error.stack);
        if (error.code) console.error('- Code:', error.code);
        if (error.reason) console.error('- Reason:', error.reason);
        if (error.data) console.error('- Data:', error.data);
        throw error;
    }
}

// Export the function
module.exports = createTemplate;

// Run test template creation if called directly
if (require.main === module) {
    // Create Gold template (ID: 1)
    createTemplate(1, {
        name: "Gold",
        baseBalance: "20",
        price: "20",
        discount: 0,
        isVIP: false
    })
        .then(result => {
            console.log("\nTemplate creation successful!");
            console.log("Result:", result);
            process.exit(0);
        })
        .catch(error => {
            console.error("\nTemplate creation failed:", error);
            process.exit(1);
        });
}