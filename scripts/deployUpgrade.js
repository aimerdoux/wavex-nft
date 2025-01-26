// scripts/deployUpgrade.js
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        console.log("Starting WaveX NFT contract upgrade deployment...");

        // Configure gas settings
        const deploymentGasSettings = {
            maxFeePerGas: ethers.parseUnits("50", "gwei"),
            maxPriorityFeePerGas: ethers.parseUnits("25", "gwei"),
            gasLimit: 5000000
        };

        console.log("\nGas Settings:");
        console.log("=============");
        console.log("Max Fee Per Gas:", ethers.formatUnits(deploymentGasSettings.maxFeePerGas, "gwei"), "gwei");
        console.log("Max Priority Fee:", ethers.formatUnits(deploymentGasSettings.maxPriorityFeePerGas, "gwei"), "gwei");
        console.log("Gas Limit:", deploymentGasSettings.gasLimit.toString());

        // Get the ContractFactory
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        
        // Deploy the contract with gas settings
        console.log("\nDeploying updated contract...");
        const wavexNFT = await WaveXNFT.deploy(deploymentGasSettings);
        
        console.log("Waiting for deployment transaction...");
        await wavexNFT.waitForDeployment();
        
        // Get the deployed contract address
        const contractAddress = await wavexNFT.getAddress();
        console.log("Updated contract deployed to:", contractAddress);

        // Set base URI if provided
        if (process.env.BASE_URI) {
            console.log("Setting base URI...");
            const setURITx = await wavexNFT.setBaseURI(
                process.env.BASE_URI,
                deploymentGasSettings
            );
            await setURITx.wait();
            console.log("Base URI set successfully");
        }

        // Save deployment info
        const deploymentInfo = {
            networkName: hre.network.name,
            contractAddress: contractAddress,
            deploymentTime: new Date().toISOString(),
            version: "v1.1.0", // Updated version with benefit modification
            deploymentBlock: await hre.ethers.provider.getBlockNumber(),
            chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
            deploymentTransaction: wavexNFT.deploymentTransaction().hash
        };

        // Create deployments directory if it doesn't exist
        const deploymentsDir = path.join(__dirname, '../deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir);
        }

        // Save deployment info
        const deploymentPath = path.join(
            deploymentsDir,
            `${hre.network.name}_deployment.json`
        );
        fs.writeFileSync(
            deploymentPath,
            JSON.stringify(deploymentInfo, null, 2)
        );
        console.log(`Deployment info saved to ${deploymentPath}`);

        // Verify contract if on testnet/mainnet
        if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
            console.log("\nWaiting for contract to be propagated before verification...");
            await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds delay

            console.log("Verifying contract on explorer...");
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

        console.log("\nDeployment Summary:");
        console.log("===================");
        console.log("Network:", hre.network.name);
        console.log("Contract Address:", contractAddress);
        console.log("Transaction Hash:", deploymentInfo.deploymentTransaction);
        console.log("Block Number:", deploymentInfo.deploymentBlock);

        return deploymentInfo;
    } catch (error) {
        console.error("\nDetailed error information:");
        console.error("===========================");
        console.error(error);
        throw error;
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