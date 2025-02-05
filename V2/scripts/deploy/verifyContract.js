// scripts/deploy/verifyContract.js
const hre = require("hardhat");
require('dotenv').config({ path: 'V2.env' });

async function main() {
    try {
        const contractAddress = "0x54083F594B420C897E7b49b8bdd6E2e170F28cB6";  // Using direct address

        console.log("Starting contract verification on Polygonscan...");
        console.log("Contract address:", contractAddress);

        console.log("Verifying contract...");
        await hre.run("verify:verify", {
            address: contractAddress,
            constructorArguments: []
            // Removed contract path to let Hardhat find it automatically
        });

        console.log("Contract verified successfully!");
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log("Contract is already verified!");
        } else {
            console.error("Verification error:", error);
            console.log("\nDebug information:");
            console.log("Contract path:", "C:\\Users\\OHG\\Documents\\wavex-nft\\V2\\contracts\\WavexNFTV2.sol");
            console.log("Contract name:", "WavexNFTV2");
            console.log("\nPlease ensure:");
            console.log("1. The contract is compiled (npx hardhat compile)");
            console.log("2. The Polygonscan API key is correct");
            console.log("3. The contract address is correct");
        }
        process.exit(1);
    }
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;