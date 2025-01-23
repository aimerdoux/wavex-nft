const hre = require("hardhat");

async function main() {
    // Contract address from your deployment
    const CONTRACT_ADDRESS = "0xD718613a5463e99a5947D2AF37Ce50b6E8B126d9";
    
    // Get the contract factory and attach to deployed contract
    const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
    const wavexNFT = WaveXNFT.attach(CONTRACT_ADDRESS);
    
    console.log("Connected to WaveXNFT at:", CONTRACT_ADDRESS);

    try {
        // Number of NFTs to mint
        const numToMint = 5; // You can adjust this number
        
        // Mint multiple NFTs
        for(let i = 0; i < numToMint; i++) {
            console.log(`Minting NFT #${i + 1}...`);
            const tx = await wavexNFT.mint();
            const receipt = await tx.wait();
            
            // Get the TokenID from the event logs
            const mintEvent = receipt.logs.find(
                log => log.fragment && log.fragment.name === 'Transfer'
            );
            const tokenId = mintEvent.args[2]; // TokenID is the third parameter in Transfer event
            
            console.log(`Successfully minted NFT with ID: ${tokenId}`);
        }
        
        // Get total supply after minting
        const totalSupply = await wavexNFT.totalSupply();
        console.log(`\nTotal supply after minting: ${totalSupply}`);
        
    } catch (error) {
        console.error("Error during minting:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });