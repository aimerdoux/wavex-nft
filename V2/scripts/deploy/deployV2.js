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

        // Deploy contract
        console.log("Deploying contract...");
        const wavexNFTV2 = await WaveXNFTV2.deploy();
        await wavexNFTV2.waitForDeployment();
        
        const contractAddress = await wavexNFTV2.getAddress();
        console.log("Contract deployed to:", contractAddress);

        // Save deployment info
        const deploymentInfo = {
            networkName: hre.network.name,
            contractAddress: contractAddress,
            deploymentTime: new Date().toISOString(),
            deployer: deployer.address
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