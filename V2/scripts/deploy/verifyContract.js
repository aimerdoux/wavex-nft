// scripts/deploy/verifyContract.js
const hre = require("hardhat");
require('dotenv').config({ path: 'V2.env' });

async function main() {
    try {
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        if (!contractAddress) {
            throw new Error("WAVEX_NFT_V2_ADDRESS not found in environment");
        }

        console.log("Starting contract verification on Polygonscan...");
        console.log("Contract address:", contractAddress);
        console.log("Network:", hre.network.name);

        // Ensure the contract is compiled
        console.log("\nCompiling contracts...");
        await hre.run("compile");

        console.log("\nVerifying contract...");
        await hre.run("verify", {
            address: contractAddress,
            constructorArguments: []
        });

        console.log("\nContract verified successfully!");

    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log("\nContract is already verified!");
        } else if (error.message.includes("ContractNotFoundError")) {
            console.error("\nError: Contract not found in compilation artifacts.");
            console.log("\nTroubleshooting steps:");
            console.log("1. Ensure your contract is in the contracts/ directory");
            console.log("2. Run 'npx hardhat clean' to clear the cache");
            console.log("3. Run 'npx hardhat compile' before verifying");
            console.log("4. Check hardhat.config.js for correct contract paths");
        } else {
            console.error("\nVerification error:", error);
            console.log("\nDebug information:");
            console.log("Network:", hre.network.name);
            console.log("Contract address:", contractAddress);
            console.log("\nPossible solutions:");
            console.log("1. Wait a few minutes for the contract to be available on the explorer");
            console.log("2. Check if your Polygonscan API key is correctly set");
            console.log("3. Ensure the contract is deployed to the correct network");
        }
        process.exit(1);
    }
}

// Add cleanup handler
process.on('SIGINT', () => {
    console.log("\nVerification process interrupted");
    process.exit(0);
});

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;