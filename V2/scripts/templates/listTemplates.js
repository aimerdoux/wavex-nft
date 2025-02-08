// scripts/templates/listTemplates.js
const hre = require("hardhat");
require('dotenv').config();

async function listTemplates(options = {}) {
    try {
        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        if (!contractAddress) {
            throw new Error("WAVEX_NFT_V2_ADDRESS not found in environment");
        }

        console.log("Contract address:", contractAddress);

        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get network gas settings
        const networkConfig = hre.config.networks[hre.network.name];
        console.log('\nUsing network gas settings:', {
            gasPrice: networkConfig.gasPrice ? hre.ethers.formatUnits(networkConfig.gasPrice, 'gwei') + ' gwei' : 'Not set',
            gasLimit: networkConfig.gasLimit || 'Not set'
        });

        // Use more conservative gas settings for view functions
        const gasSettings = {
            gasPrice: networkConfig.gasPrice,
            gasLimit: 100000 // Lower gas limit for view functions
        };

        console.log("\nFetching template information...");
        
        const templates = [];
        
        // Get template details for IDs 1 and 2 (default templates)
        for (let i = 1; i <= 2; i++) {
            try {
                const [
                    name,
                    baseBalance,
                    price,
                    discount,
                    isVIP,
                    metadataURI,
                    active
                ] = await wavexNFT.getTemplate(i, gasSettings);

                templates.push({
                    id: i,
                    name,
                    baseBalance: hre.ethers.formatEther(baseBalance),
                    price: hre.ethers.formatEther(price),
                    discount: Number(discount),
                    isVIP,
                    metadataURI,
                    active
                });

                console.log(`\nTemplate ${i} found:`);
                console.log(`- Name: ${name}`);
                console.log(`- Base Balance: ${hre.ethers.formatEther(baseBalance)} MATIC`);
                console.log(`- Price: ${hre.ethers.formatEther(price)} MATIC`);
                console.log(`- Discount: ${Number(discount)}%`);
                console.log(`- VIP: ${isVIP}`);
                console.log(`- Active: ${active}`);
                console.log(`- Metadata URI: ${metadataURI}`);

            } catch (error) {
                if (error.message.includes("Template does not exist")) {
                    console.log(`Template ${i} not found or inactive`);
                } else {
                    console.error(`Error fetching template ${i}:`, error.message);
                }
            }
        }

        if (options.format === 'json') {
            console.log("\nTemplate List (JSON):");
            console.log(JSON.stringify(templates, null, 2));
        } else {
            console.log("\nTemplate List (Table):");
            console.table(templates);
        }

        return templates;
    } catch (error) {
        console.error("\nError listing templates:");
        console.error('- Message:', error.message);
        console.error('- Stack:', error.stack);
        if (error.code) console.error('- Code:', error.code);
        if (error.reason) console.error('- Reason:', error.reason);
        if (error.data) console.error('- Data:', error.data);
        throw error;
    }
}

// Export the function
module.exports = listTemplates;

// Run if called directly
if (require.main === module) {
    listTemplates()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}