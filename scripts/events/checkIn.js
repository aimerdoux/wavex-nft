const { ethers } = require('hardhat');
const { AppleWalletManager } = require('../apple-wallet/passManager');

async function handleEventCheckIn(tokenId, eventId) {
    // 1. Verify NFT ownership and event registration
    const contract = await ethers.getContractAt(
        "WaveXMembership",
        process.env.CONTRACT_ADDRESS
    );
    
    const isRegistered = await contract.isRegisteredForEvent(tokenId, eventId);
    if (!isRegistered) {
        throw new Error("Token not registered for this event");
    }

    // 2. Get event details
    const eventDetails = await contract.getEventDetails(eventId);
    
    // 3. Create event pass
    const walletManager = new AppleWalletManager(
        process.env.APPLE_CERT_PATH,
        process.env.APPLE_CERT_PASSWORD
    );

    const passData = await walletManager.generatePass(
        {
            eventId,
            name: eventDetails.name,
            date: eventDetails.date,
            time: eventDetails.time,
            location: eventDetails.location,
            benefits: [
                { name: "Drink Allowance", value: "200", unit: "USD" },
                { name: "VIP Access", value: "Included", unit: "" }
            ]
        },
        tokenId
    );

    return passData;
}

module.exports = { handleEventCheckIn };