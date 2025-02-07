// scripts/deploy/deployV2.js
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'V2.env' });

async function main() {
    try {
        console.log("Starting WaveX NFT V2 deployment on Polygon Amoy...");

        // Get the contract factory
        const WaveXNFTV2 = await hre.ethers.getContractFactory("WaveXNFTV2");
        
        // Get deployer account
        const [deployer] = await hre.ethers.getSigners();
        console.log("Deploying contracts with account:", deployer.address);
        
        // Get balance
        const provider = hre.ethers.provider;
        const balance = await provider.getBalance(deployer.address);
        console.log("Account balance:", hre.ethers.formatEther(balance), "MATIC");

        // Gas settings for Polygon Amoy
        const gasSettings = {
            gasLimit: process.env.GAS_LIMIT || 5000000,
            gasPrice: process.env.GAS_PRICE || 35000000000
        };

        // Deploy contract
        console.log("Deploying contract...");
        const wavexNFTV2 = await WaveXNFTV2.deploy(gasSettings);
        await wavexNFTV2.waitForDeployment();
        
        const contractAddress = await wavexNFTV2.getAddress();
        console.log("Contract deployed to:", contractAddress);

        // Update templates with correct discounts
        console.log("\nUpdating templates with correct discounts...");
        
        const templateUpdates = [
            { id: 1, name: "Gold", discount: 6 },
            { id: 2, name: "Platinum", discount: 12 },
            { id: 3, name: "Black", discount: 0 },
            { id: 4, name: "EventBrite", discount: 0 }
        ];

        for (const template of templateUpdates) {
            console.log(`\nUpdating ${template.name} template...`);
            const currentTemplate = await wavexNFTV2.getTemplate(template.id);
            
            await wavexNFTV2.modifyTemplate(
                template.id,
                currentTemplate.name,
                currentTemplate.baseBalance,
                currentTemplate.price,
                template.discount,
                currentTemplate.isVIP,
                currentTemplate.metadataURI,
                currentTemplate.active,
                gasSettings
            );
        }

        // Verify final template configuration
        console.log("\nVerifying final template configuration:");
        console.log("====================================");

        for (const template of templateUpdates) {
            const templateData = await wavexNFTV2.getTemplate(template.id);
            console.log(`\n${template.name} Template:`);
            console.log("------------------------");
            console.log("Name:", templateData.name);
            console.log("Base Balance:", hre.ethers.formatEther(templateData.baseBalance), "WAVEX");
            console.log("Price:", hre.ethers.formatEther(templateData.price), "WAVEX");
            console.log("Discount:", templateData.discount.toString(), "%");
            console.log("VIP Access:", templateData.isVIP);
            console.log("Metadata URI:", templateData.metadataURI);
            console.log("Active:", templateData.active);
        }

        // Save deployment info
        const deploymentInfo = {
            networkName: hre.network.name,
            contractAddress: contractAddress,
            deploymentTime: new Date().toISOString(),
            deployer: deployer.address,
            templates: templateUpdates.map(t => ({
                id: t.id,
                name: t.name,
                discount: t.discount
            }))
        };

        const deploymentsDir = path.join(__dirname, '../../deployments/v2');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }

        const deploymentPath = path.join(
            deploymentsDir,
            `${hre.network.name}_deployment.json`
        );
        
        fs.writeFileSync(
            deploymentPath,
            JSON.stringify(deploymentInfo, null, 2)
        );

        // Update V2.env
        let envContent = fs.readFileSync('V2.env', 'utf8');
        envContent = envContent.replace(
            /WAVEX_NFT_V2_ADDRESS=.*/,
            `WAVEX_NFT_V2_ADDRESS=${contractAddress}`
        );
        fs.writeFileSync('V2.env', envContent);

        console.log("\nDeployment completed successfully!");
        console.log("Configuration files updated");
        
        return deploymentInfo;

    } catch (error) {
        console.error("Error during deployment:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;