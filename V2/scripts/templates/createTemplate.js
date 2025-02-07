// scripts/templates/createTemplate.js
const hre = require("hardhat");
const { TEMPLATE_METADATA } = require('../config/metadataConfig');
const { getTemplateMetadata } = require('../config/templateConfig');
const { uploadToIPFS } = require('../utils/pinataUtils');

async function createTemplate(templateId, options = {}) {
    try {
        // Validate template exists in metadata config
        if (!TEMPLATE_METADATA[templateId]) {
            throw new Error(`Template ID ${templateId} not found in metadata configuration`);
        }

        const template = TEMPLATE_METADATA[templateId];
        
        // Generate and upload metadata
        const metadata = await getTemplateMetadata(templateId);
        const metadataURI = await uploadToIPFS(JSON.stringify(metadata));

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Create template on-chain
        const tx = await wavexNFT.createTemplate(
            template.name,
            hre.ethers.parseEther(template.baseBalance || "0"),
            hre.ethers.parseEther(template.price || "0"),
            template.discount || 0,
            template.isVIP || false,
            `ipfs://${metadataURI}`,
            options.gasLimit
        );

        console.log(`Creating template ${templateId} (${template.name})...`);
        const receipt = await tx.wait();
        
        console.log(`Template created successfully! Transaction: ${receipt.transactionHash}`);
        return { templateId, metadataURI, transactionHash: receipt.transactionHash };
    } catch (error) {
        console.error("Error creating template:", error);
        throw error;
    }
}