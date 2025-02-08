// scripts/test/testContractInteraction.js
const hre = require("hardhat");
require('dotenv').config();

async function testContractInteraction() {
    try {
        console.log("\nStarting WaveX V2 Contract Interaction Test...\n");

        // Get contract address
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        if (!contractAddress) {
            throw new Error("WAVEX_NFT_V2_ADDRESS not found in environment");
        }
        console.log("Contract address:", contractAddress);

        // Get contract instance
        console.log("\nGetting contract instance...");
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const contract = WaveXNFT.attach(contractAddress);

        // Get network info
        const provider = hre.ethers.provider;
        const network = await provider.getNetwork();
        console.log('\nNetwork information:');
        console.log('- Name:', network.name);
        console.log('- Chain ID:', network.chainId);

        // Get deployer account
        const [deployer] = await hre.ethers.getSigners();
        console.log('\nDeployer account:', deployer.address);
        const balance = await provider.getBalance(deployer.address);
        console.log('Account balance:', hre.ethers.formatEther(balance), 'MATIC');

        // Test basic reads
        console.log("\nTesting basic contract reads...");
        const name = await contract.name();
        const symbol = await contract.symbol();
        console.log("- Contract Name:", name);
        console.log("- Symbol:", symbol);

        // Test template reads
        console.log("\nTesting template reads...");
        const templateIds = [1, 2, 3, 4];
        for (const id of templateIds) {
            try {
                const template = await contract.getTemplate(id);
                console.log(`\nTemplate ${id}:`);
                console.log("- Name:", template.name);
                console.log("- Base Balance:", hre.ethers.formatEther(template.baseBalance));
                console.log("- Price:", hre.ethers.formatEther(template.price));
                console.log("- Discount:", template.discount.toString());
                console.log("- VIP:", template.isVIP);
                console.log("- Active:", template.active);
            } catch (error) {
                console.log(`Template ${id} not found:`, error.message);
            }
        }

        // Test merchant status
        console.log("\nTesting merchant authorization...");
        const merchantAddress = process.env.MERCHANT_ADDRESS;
        if (merchantAddress) {
            const isMerchant = await contract.authorizedMerchants(merchantAddress);
            console.log("- Merchant address:", merchantAddress);
            console.log("- Is authorized:", isMerchant);
        }

        // Test supported tokens
        console.log("\nTesting supported tokens...");
        const usdtAddress = process.env.USDT_CONTRACT_ADDRESS;
        const usdcAddress = process.env.USDC_CONTRACT_ADDRESS;
        if (usdtAddress) {
            const isUsdtSupported = await contract.supportedTokens(usdtAddress);
            console.log("- USDT supported:", isUsdtSupported);
        }
        if (usdcAddress) {
            const isUsdcSupported = await contract.supportedTokens(usdcAddress);
            console.log("- USDC supported:", isUsdcSupported);
        }

        console.log("\nContract interaction test completed successfully!");
        return true;

    } catch (error) {
        console.error("\nError in contract interaction test:");
        console.error('- Message:', error.message);
        console.error('- Stack:', error.stack);
        if (error.code) console.error('- Code:', error.code);
        if (error.reason) console.error('- Reason:', error.reason);
        if (error.data) console.error('- Data:', error.data);
        throw error;
    }
}

// Export the function
module.exports = testContractInteraction;

// Run test if called directly
if (require.main === module) {
    testContractInteraction()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}