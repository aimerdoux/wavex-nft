// scripts/setup/setupTokens.js
async function main() {
    const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
    const WaveXNFTV2 = await hre.ethers.getContractFactory("WaveXNFTV2");
    const contract = WaveXNFTV2.attach(contractAddress);

    const usdtAddress = process.env.USDT_CONTRACT_ADDRESS.split('#')[0].trim();
    const usdcAddress = process.env.USDC_CONTRACT_ADDRESS.split('#')[0].trim();

    console.log("Setting up supported tokens...");
    
    for (const tokenAddress of [usdtAddress, usdcAddress]) {
        console.log(`Adding token: ${tokenAddress}`);
        const tx = await contract.addSupportedToken(tokenAddress, {
            gasPrice: BigInt(process.env.GAS_PRICE)
        });
        await tx.wait();
        console.log(`Token ${tokenAddress} added successfully`);
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });