const hre = require("hardhat");

async function main() {
    // Contract address from your deployment
    const CONTRACT_ADDRESS = "0xD718613a5463e99a5947D2AF37Ce50b6E8B126d9";
    
    // Get the contract factory and attach to deployed contract
    const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
    const wavexNFT = WaveXNFT.attach(CONTRACT_ADDRESS);
    
    console.log("Connected to WaveXNFT at:", CONTRACT_ADDRESS);

    try {
        // Add different benefits to each NFT
        const benefitPlans = [
            {
                tokenId: 0,
                benefitType: 0, // MERCHANT_ALLOWANCE
                value: 1000, // $1000 allowance
                durationInDays: 365
            },
            {
                tokenId: 1,
                benefitType: 1, // YACHT_EVENT
                value: 1, // 1 event access
                durationInDays: 180
            },
            {
                tokenId: 2,
                benefitType: 2, // DISCOUNT
                value: 25, // 25% discount
                durationInDays: 365
            },
            {
                tokenId: 3,
                benefitType: 0, // MERCHANT_ALLOWANCE
                value: 500, // $500 allowance
                durationInDays: 180
            },
            {
                tokenId: 4,
                benefitType: 1, // YACHT_EVENT
                value: 2, // 2 event accesses
                durationInDays: 365
            }
        ];

        for (const plan of benefitPlans) {
            console.log(`\nAdding benefit to NFT #${plan.tokenId}:`);
            console.log(`- Type: ${['MERCHANT_ALLOWANCE', 'YACHT_EVENT', 'DISCOUNT'][plan.benefitType]}`);
            console.log(`- Value: ${plan.value}`);
            console.log(`- Duration: ${plan.durationInDays} days`);

            const tx = await wavexNFT.addBenefit(
                plan.tokenId,
                plan.benefitType,
                plan.value,
                plan.durationInDays
            );
            await tx.wait();
            console.log('Benefit added successfully!');
        }

        // Verify benefits were added
        console.log('\nVerifying benefits...');
        for (let i = 0; i < 5; i++) {
            const benefits = await wavexNFT.getBenefits(i);
            console.log(`\nNFT #${i} benefits:`, benefits);
        }
        
    } catch (error) {
        console.error("Error adding benefits:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });