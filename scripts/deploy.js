// scripts/deploy.js
// Deploy the WaveXNFT contract and save deployment info to a JSON file,
// with optional base URI and initial merchant settings. The contract is also verified 

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        console.log("Starting WaveX NFT deployment...");

        // Get the contract factory
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        
        // Deploy the contract
        console.log("Deploying contract...");
        const wavexNFT = await WaveXNFT.deploy();
        await wavexNFT.waitForDeployment();
        
        // Get the deployed contract address
        const contractAddress = await wavexNFT.getAddress();
        console.log("Contract deployed to:", contractAddress);

        // Get contract constants
        const maxSupply = await wavexNFT.MAX_SUPPLY();
        const maxBatchMint = await wavexNFT.MAX_BATCH_MINT();
        console.log(`Maximum supply: ${maxSupply}`);
        console.log(`Maximum batch mint: ${maxBatchMint}`);

        // Set base URI (if provided in environment)
        if (process.env.BASE_URI) {
            console.log("Setting base URI to:", process.env.BASE_URI);
            const setURITx = await wavexNFT.setBaseURI(process.env.BASE_URI);
            await setURITx.wait();
            console.log("Base URI set successfully");
        }

        // Add initial merchant if provided
        if (process.env.INITIAL_MERCHANT) {
            console.log("Adding initial merchant:", process.env.INITIAL_MERCHANT);
            const merchantTx = await wavexNFT.setMerchantStatus(process.env.INITIAL_MERCHANT, true);
            await merchantTx.wait();
            console.log("Initial merchant authorized successfully");
        }

        // Save deployment info
        const deploymentInfo = {
            networkName: hre.network.name,
            contractAddress: contractAddress,
            deploymentTime: new Date().toISOString(),
            deployer: (await hre.ethers.getSigners())[0].address,
            maxSupply: maxSupply.toString(),
            maxBatchMint: maxBatchMint.toString(),
            baseURI: process.env.BASE_URI || "",
            initialMerchant: process.env.INITIAL_MERCHANT || "",
            deploymentBlock: await hre.ethers.provider.getBlockNumber(),
            chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
            contractName: "WaveXNFT",
            contractSymbol: await wavexNFT.symbol()
        };

        // Create deployments directory if it doesn't exist
        const deploymentsDir = path.join(__dirname, '../deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir);
        }

        // Save deployment info to file
        const deploymentPath = path.join(
            deploymentsDir,
            `${hre.network.name}_deployment.json`
        );
        fs.writeFileSync(
            deploymentPath,
            JSON.stringify(deploymentInfo, null, 2)
        );
        console.log(`Deployment info saved to ${deploymentPath}`);

        // Verify contract if on a supported network
        if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
            console.log("\nVerifying contract on explorer...");
            try {
                await hre.run("verify:verify", {
                    address: contractAddress,
                    constructorArguments: []
                });
                console.log("Contract verified successfully");
            } catch (error) {
                if (error.message.includes("Already Verified")) {
                    console.log("Contract already verified");
                } else {
                    console.error("Error verifying contract:", error);
                }
            }
        }

        // Print deployment summary
        console.log("\nDeployment Summary:");
        console.log("===================");
        console.log(`Network: ${hre.network.name}`);
        console.log(`Contract Address: ${contractAddress}`);
        console.log(`Max Supply: ${maxSupply}`);
        console.log(`Max Batch Mint: ${maxBatchMint}`);
        if (process.env.BASE_URI) {
            console.log(`Base URI: ${process.env.BASE_URI}`);
        }
        if (process.env.INITIAL_MERCHANT) {
            console.log(`Initial Merchant: ${process.env.INITIAL_MERCHANT}`);
        }

        return deploymentInfo;
    } catch (error) {
        console.error("Error during deployment:", error);
        process.exit(1);
    }
}

// Execute deployment
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;