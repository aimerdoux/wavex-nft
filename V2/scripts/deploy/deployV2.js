// scripts/deploy/deployV2.js
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function deployV2() {
    try {
        console.log("\n=== Starting WaveX NFT V2 deployment on Polygon Amoy ===\n");

        // Get deployer account
        const [deployer] = await hre.ethers.getSigners();
        console.log("Deploying contracts with account:", deployer.address);
        
        // Get balance
        const provider = hre.ethers.provider;
        const balance = await provider.getBalance(deployer.address);
        console.log("Account balance:", hre.ethers.formatEther(balance), "MATIC");

        // Get network info
        const network = await provider.getNetwork();
        console.log('\nNetwork information:');
        console.log('- Name:', network.name);
        console.log('- Chain ID:', network.chainId);

        // Get gas settings from network config
        const networkConfig = hre.config.networks[network.name];
        console.log('\nUsing network gas settings:', {
            gasPrice: networkConfig.gasPrice ? hre.ethers.formatUnits(networkConfig.gasPrice, 'gwei') + ' gwei' : 'Not set',
            gasLimit: networkConfig.gasLimit || 'Not set'
        });

        const gasSettings = {
            gasPrice: networkConfig.gasPrice,
            gasLimit: 100000 // Lower gas limit for deployment
        };

        // Deploy contract
        console.log('\nDeploying contract...');
        const WaveXNFTV2 = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFTV2 = await WaveXNFTV2.deploy(gasSettings);
        console.log('Deployment transaction sent:', wavexNFTV2.deploymentTransaction().hash);
        
        console.log('Waiting for deployment transaction...');
        await wavexNFTV2.waitForDeployment();
        
        const contractAddress = await wavexNFTV2.getAddress();
        console.log('Contract deployed to:', contractAddress);

        // Initialize contract
        console.log('\nInitializing contract...');

        // Add supported tokens
        console.log('\nAdding supported tokens...');
        const usdtAddress = process.env.USDT_CONTRACT_ADDRESS;
        const usdcAddress = process.env.USDC_CONTRACT_ADDRESS;

        if (usdtAddress) {
            console.log('Adding USDT support...');
            const addUsdtTx = await wavexNFTV2.addSupportedToken(usdtAddress, gasSettings);
            await addUsdtTx.wait();
            console.log('USDT support added');
        }

        if (usdcAddress) {
            console.log('Adding USDC support...');
            const addUsdcTx = await wavexNFTV2.addSupportedToken(usdcAddress, gasSettings);
            await addUsdcTx.wait();
            console.log('USDC support added');
        }

        // Initialize default templates
        console.log('\nInitializing default templates...');
        const initTx = await wavexNFTV2.initializeDefaultTemplates(gasSettings);
        await initTx.wait();
        console.log('Default templates initialized');

        // Authorize merchant
        console.log('\nAuthorizing merchant...');
        const merchantAddress = process.env.MERCHANT_ADDRESS;
        if (merchantAddress) {
            const authTx = await wavexNFTV2.authorizeMerchant(merchantAddress, gasSettings);
            await authTx.wait();
            console.log('Merchant authorized:', merchantAddress);
        }

        // Save deployment info
        const deploymentInfo = {
            networkName: network.name,
            chainId: Number(network.chainId),
            contractAddress: contractAddress,
            deploymentTime: new Date().toISOString(),
            deployer: deployer.address,
            supportedTokens: {
                USDT: usdtAddress || '',
                USDC: usdcAddress || ''
            },
            authorizedMerchants: [merchantAddress]
        };

        const deploymentsDir = path.join(__dirname, '../../deployments/v2');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }

        const deploymentPath = path.join(
            deploymentsDir,
            `${network.name}_deployment.json`
        );
        
        fs.writeFileSync(
            deploymentPath,
            JSON.stringify(deploymentInfo, null, 2)
        );

        // Update .env
        let envContent = fs.readFileSync('.env', 'utf8');
        envContent = envContent.replace(
            /WAVEX_NFT_V2_ADDRESS=.*/,
            `WAVEX_NFT_V2_ADDRESS=${contractAddress}`
        );
        fs.writeFileSync('.env', envContent);

        console.log("\nDeployment completed successfully!");
        console.log("Configuration files updated");
        
        return deploymentInfo;

    } catch (error) {
        console.error("\nError during deployment:");
        console.error('- Message:', error.message);
        console.error('- Stack:', error.stack);
        if (error.code) console.error('- Code:', error.code);
        if (error.reason) console.error('- Reason:', error.reason);
        if (error.data) console.error('- Data:', error.data);
        throw error;
    }
}

// Export the deployV2 function
module.exports = { deployV2 };

// Run deployment if called directly
if (require.main === module) {
    deployV2()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}