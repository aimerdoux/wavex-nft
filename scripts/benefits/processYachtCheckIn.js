const { ethers } = require("hardhat");
const { BenefitType } = require("../utils/benefitTypes");
const { getDeployedAddresses } = require("../utils/deploymentUtils"); // Add this utility if not exists

async function processYachtCheckIns() {
    // Get deployed contract addresses
    const addresses = await getDeployedAddresses();
    
    // Get contract instances
    const eventManager = await ethers.getContractAt("WaveXEventManager", addresses.eventManager);
    const waveXNFT = await ethers.getContractAt("WaveXNFT", addresses.waveXNFT);

    console.log("Starting yacht check-in processor...");

    // Listen for CheckedIn events
    eventManager.on("CheckedIn", async (tokenId, eventId) => {
        try {
            console.log(`Processing check-in for token ${tokenId} at event ${eventId}`);
            
            // Get event details
            const eventDetails = await eventManager.getEventDetails(eventId);
            
            // Check if this is a yacht event (case insensitive)
            if (eventDetails.name.toLowerCase().includes("yacht")) {
                console.log(`Yacht event detected for token ${tokenId}`);
                
                // Verify benefit hasn't been redeemed yet
                const benefitStatus = await waveXNFT.getBenefitStatus(tokenId, BenefitType.YACHT_EVENT);
                if (benefitStatus.isRedeemed) {
                    console.log(`Yacht benefit already redeemed for token ${tokenId}`);
                    return;
                }

                // Redeem the yacht benefit
                const tx = await waveXNFT.redeemBenefit(
                    tokenId,
                    BenefitType.YACHT_EVENT,
                    1
                );
                await tx.wait();
                
                console.log(`✅ Yacht benefit successfully redeemed for token ${tokenId}`);
            }
        } catch (error) {
            console.error(`❌ Error processing check-in for token ${tokenId}:`, error);
        }
    });

    console.log("🎧 Listening for check-in events...");
}

// Script execution
if (require.main === module) {
    processYachtCheckIns()
        .catch((error) => {
            console.error(error);
            process.exitCode = 1;
        });
}

module.exports = {
    processYachtCheckIns
};