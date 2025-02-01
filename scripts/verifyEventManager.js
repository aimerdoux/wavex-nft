// scripts/verifyEventManager.js
const hre = require("hardhat");

async function main() {
    const deploymentPath = require('path').join(
        __dirname,
        '../deployments',
        `${hre.network.name}_eventmanager_deployment.json`
    );
    
    const deploymentInfo = require(deploymentPath);
    
    console.log("Verifying contract on Polygonscan...");
    console.log("Contract address:", deploymentInfo.contractAddress);
    console.log("WaveXNFT address:", deploymentInfo.waveXNFTAddress);

    try {
        await hre.run("verify:verify", {
            address: deploymentInfo.contractAddress,
            constructorArguments: [deploymentInfo.waveXNFTAddress]
        });
        console.log("Contract verified successfully!");
    } catch (error) {
        console.error("Verification error:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });