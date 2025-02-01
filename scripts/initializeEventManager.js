// scripts/initializeEventManager.js
const hre = require("hardhat");

async function main() {
    try {
        // Load deployment info
        const deploymentPath = require('path').join(
            __dirname,
            '../deployments',
            `${hre.network.name}_eventmanager_deployment.json`
        );
        const deploymentInfo = require(deploymentPath);

        // Get contract instance
        const eventManager = await hre.ethers.getContractAt(
            "WaveXEventManager",
            deploymentInfo.contractAddress
        );

        console.log("Initializing WaveX Event Manager...");
        console.log("Contract address:", deploymentInfo.contractAddress);

        // Example: Set entrances for token IDs 1-5
        console.log("\nSetting token entrances...");
        for (let tokenId = 1; tokenId <= 5; tokenId++) {
            const tx = await eventManager.setTokenEntrances(tokenId, 2); // 2 entrances per token
            await tx.wait();
            console.log(`Set 2 entrances for token ${tokenId}`);
        }

        // Example: Create a test event
        console.log("\nCreating test event...");
        const currentTime = Math.floor(Date.now() / 1000);
        const eventDate = currentTime + (7 * 24 * 60 * 60); // 7 days from now
        
        const tx = await eventManager.createEvent(
            "Test Event",
            "Virtual Location",
            eventDate,
            100 // max capacity
        );
        await tx.wait();
        console.log("Test event created successfully");

        // Get event details
        const eventDetails = await eventManager.getEventDetails(0);
        console.log("\nEvent Details:");
        console.log("Event ID:", eventDetails.eventId.toString());
        console.log("Name:", eventDetails.name);
        console.log("Location:", eventDetails.location);
        console.log("Date:", new Date(Number(eventDetails.date) * 1000).toLocaleString()); // Fixed BigInt conversion
        console.log("Max Capacity:", eventDetails.maxCapacity.toString());
        console.log("Booked Count:", eventDetails.bookedCount.toString());
        console.log("Is Active:", eventDetails.isActive);

        // Get event count
        const eventCount = await eventManager.getEventCount();
        console.log("\nTotal Events:", eventCount.toString());

        // Check available entrances for a token
        const availableEntrances = await eventManager.getAvailableEntrances(1);
        console.log("\nAvailable entrances for token 1:", availableEntrances.toString());

    } catch (error) {
        console.error("Initialization error:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });