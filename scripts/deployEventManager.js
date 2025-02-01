// scripts/deployEventManager.js
//npx hardhat run scripts/deployEventManager.js --network polygonAmoy
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        console.log("Starting WaveX Event Manager deployment...");
        
        // Get the WaveXNFT contract address from environment variables
        const waveXNFTAddress = process.env.CONTRACT_ADDRESS;
        if (!waveXNFTAddress) {
            throw new Error("WaveXNFT contract address not found in environment variables");
        }

        // Get the contract factory
        const WaveXEventManager = await hre.ethers.getContractFactory("WaveXEventManager");
        
        // Get network configuration and deployer
        const [deployer] = await hre.ethers.getSigners();
        
        // Log pre-deployment information
        console.log("\nPre-deployment Information:");
        console.log("==========================");
        console.log("Deployer:", deployer.address);
        console.log("WaveXNFT Address:", waveXNFTAddress);
        
        // Deploy the contract
        console.log("\nDeploying contract...");
        const eventManager = await WaveXEventManager.deploy(
            waveXNFTAddress,
            {
                gasLimit: 3000000
            }
        );

        // Wait for deployment
        await eventManager.waitForDeployment();
        const contractAddress = await eventManager.getAddress();
        console.log("Contract deployed to:", contractAddress);

        // Save deployment info
        const deploymentInfo = {
            contractAddress: contractAddress,
            waveXNFTAddress: waveXNFTAddress,
            deploymentTime: new Date().toISOString(),
            deployer: deployer.address,
            maxCancellationsAllowed: 1 // Default value
        };

        // Create deployments directory if it doesn't exist
        const deploymentsDir = path.join(__dirname, '../deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir);
        }

        // Save deployment info
        const deploymentPath = path.join(
            deploymentsDir,
            `${hre.network.name}_eventmanager_deployment.json`
        );
        fs.writeFileSync(
            deploymentPath,
            JSON.stringify(deploymentInfo, null, 2)
        );
        console.log(`Deployment info saved to ${deploymentPath}`);

        // Verify contract
        if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
            console.log("\nWaiting for block confirmations...");
            await eventManager.deploymentTransaction().wait(5);
            
            try {
                await hre.run("verify:verify", {
                    address: contractAddress,
                    constructorArguments: [waveXNFTAddress]
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