// scripts/verify.js
const hre = require("hardhat");
const path = require('path');
const fs = require('fs');

async function getDeployment(networkName) {
    const deploymentPath = path.join(__dirname, '../deployments', `${networkName}_deployment.json`);
    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`No deployment found for network ${networkName}`);
    }
    return JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
}

async function waitForContract(contractAddress, provider) {
    console.log("Waiting for contract to be propagated to Polygonscan...");
    
    for (let i = 0; i < 10; i++) {
        console.log(`Attempt ${i + 1} of 10`);
        const code = await provider.getCode(contractAddress);
        if (code !== "0x") {
            console.log("Contract code found!");
            // Wait an additional 30 seconds to ensure Polygonscan has indexed it
            console.log("Waiting additional 30 seconds for indexing...");
            await new Promise(resolve => setTimeout(resolve, 30000));
            return true;
        }
        console.log("Waiting 30 seconds before next attempt...");
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
    }
    return false;
}

async function main() {
    try {
        // Get network name
        const networkName = hre.network.name;
        console.log(`\nStarting verification process on ${networkName}...`);

        // Get deployment info
        const deployment = await getDeployment(networkName);
        console.log(`Found deployment at address: ${deployment.contractAddress}`);
        
        // Wait for contract to be propagated
        const hasCode = await waitForContract(deployment.contractAddress, hre.ethers.provider);
        if (!hasCode) {
            throw new Error("Contract code not found after waiting. Try again later.");
        }

        // Verify the contract
        console.log("\nAttempting contract verification...");
        await hre.run("verify:verify", {
            address: deployment.contractAddress,
            constructorArguments: [],
            contract: "contracts/WaveXNFT.sol:WaveXNFT"
        });

        console.log("\nContract verified successfully!");
        console.log(`Contract address: ${deployment.contractAddress}`);
        console.log(`Network: ${networkName}`);
        
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log("\nContract is already verified!");
        } else {
            console.error("\nError during verification:", error);
            process.exit(1);
        }
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