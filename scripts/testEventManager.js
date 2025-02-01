// scripts/testEventManager.js
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

        console.log("Testing WaveX Event Manager...");
        console.log("Contract address:", deploymentInfo.contractAddress);

        // Get test wallet
        const [wallet] = await hre.ethers.getSigners();
        console.log("Using wallet address:", wallet.address);

        // 1. Check available entrances for token 1
        console.log("\n1. Checking available entrances for token 1...");
        let availableEntrances = await eventManager.getAvailableEntrances(1);
        console.log("Available entrances:", availableEntrances.toString());

        // 2. Book first entrance for event 0
        console.log("\n2. Booking first entrance for token 1 in event 0...");
        let tx = await eventManager.bookEntrance(1, 0);
        await tx.wait();
        console.log("First entrance booked successfully");

        // 3. Check booking details
        console.log("\n3. Checking booking details for token 1...");
        const bookings = await eventManager.getTokenBookings(1);
        console.log("Token 1 bookings:", 
            bookings.map(b => ({
                isActive: b.isActive,
                eventId: b.eventId.toString(),
                entranceNumber: b.entranceNumber.toString()
            }))
        );

        // 4. Book second entrance for event 0
        console.log("\n4. Booking second entrance for token 1 in event 0...");
        tx = await eventManager.bookEntrance(1, 0);
        await tx.wait();
        console.log("Second entrance booked successfully");

        // 5. Check available entrances again
        console.log("\n5. Checking remaining entrances...");
        availableEntrances = await eventManager.getAvailableEntrances(1);
        console.log("Available entrances:", availableEntrances.toString());

        // 6. Try to cancel first entrance
        console.log("\n6. Cancelling first entrance...");
        tx = await eventManager.cancelBooking(1, 0, 0);
        await tx.wait();
        console.log("First entrance cancelled successfully");

        // 7. Check final booking status
        console.log("\n7. Final booking status for token 1:");
        const finalBookings = await eventManager.getTokenBookings(1);
        console.log("Token 1 bookings:", 
            finalBookings.map(b => ({
                isActive: b.isActive,
                eventId: b.eventId.toString(),
                entranceNumber: b.entranceNumber.toString()
            }))
        );

    } catch (error) {
        console.error("Test error:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });