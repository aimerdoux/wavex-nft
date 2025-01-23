const hre = require("hardhat");

async function main() {
    // Contract address from your deployment
    const CONTRACT_ADDRESS = "0xD718613a5463e99a5947D2AF37Ce50b6E8B126d9";
    
    // Get the contract factory and attach to deployed contract
    const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
    const wavexNFT = WaveXNFT.attach(CONTRACT_ADDRESS);
    
    console.log("Connected to WaveXNFT at:", CONTRACT_ADDRESS);

    try {
        // Get deployer's address
        const [deployer] = await hre.ethers.getSigners();
        console.log("Checking NFTs for address:", deployer.address);

        // Get total supply
        const totalSupply = await wavexNFT.totalSupply();
        console.log(`\nTotal supply: ${totalSupply}`);

        // Get balance of deployer
        const balance = await wavexNFT.balanceOf(deployer.address);
        console.log(`Balance of ${deployer.address}: ${balance}`);

        // If they have any NFTs, get the token IDs and benefits
        if (balance > 0) {
            console.log("\nFetching NFT details...");
            for(let i = 0; i < totalSupply; i++) {
                try {
                    const owner = await wavexNFT.ownerOf(i);
                    if(owner === deployer.address) {
                        console.log(`\nNFT #${i}:`);
                        const benefits = await wavexNFT.getBenefits(i);
                        console.log("Benefits:", benefits);
                    }
                } catch (error) {
                    // Skip if token doesn't exist
                    continue;
                }
            }
        }
        
    } catch (error) {
        console.error("Error checking NFTs:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });