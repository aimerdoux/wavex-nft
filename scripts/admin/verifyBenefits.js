const hre = require("hardhat");
require('dotenv').config();

async function verifyBenefits(tokenIds) {
    try {
        // Get contract instance
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const contract = WaveXNFT.attach(process.env.CONTRACT_ADDRESS);

        console.log("\n🔍 Verifying Benefits for Tokens 🔍");
        console.log("==================================");

        const benefitTypeNames = ['MERCHANT_ALLOWANCE', 'YACHT_EVENT', 'DISCOUNT'];

        for (const tokenId of tokenIds) {
            try {
                const benefits = await contract.getBenefits(tokenId);
                
                console.log(`\nToken ID: ${tokenId}`);
                console.log("----------------------");
                console.log(`Total Benefits: ${benefits.length}`);

                benefits.forEach((benefit, index) => {
                    console.log(`\nBenefit #${index}:`);
                    console.log(`Type: ${benefit.benefitType} (${benefitTypeNames[benefit.benefitType] || 'UNKNOWN'})`);
                    console.log(`Value: ${benefit.value.toString()}`);
                    console.log(`Remaining Value: ${benefit.remainingValue.toString()}`);
                    console.log(`Expiration: ${new Date(Number(benefit.expirationTime) * 1000).toLocaleString()}`);
                    console.log(`Is Redeemed: ${benefit.isRedeemed}`);
                });
            } catch (error) {
                console.error(`Error retrieving benefits for Token ${tokenId}:`, error);
            }
        }
    } catch (error) {
        console.error("Error in verification process:", error);
    }
}

async function main() {
    // Parse token range
    const tokenRange = process.env.TOKEN_RANGE;
    let tokenIds;

    if (tokenRange.includes('-')) {
        const [start, end] = tokenRange.split('-').map(Number);
        tokenIds = Array.from({length: end - start + 1}, (_, i) => start + i);
    } else {
        tokenIds = tokenRange.split(',').map(id => parseInt(id.trim()));
    }

    await verifyBenefits(tokenIds);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });