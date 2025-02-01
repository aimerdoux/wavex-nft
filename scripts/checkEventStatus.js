// scripts/checkEventStatus.js
const hre = require("hardhat");

async function main() {
    try {
        const deploymentInfo = require('../deployments/polygonAmoy_eventmanager_deployment.json');
        const eventManager = await hre.ethers.getContractAt(
            "WaveXEventManager",
            deploymentInfo.contractAddress
        );

        console.log("Checking Event Status...");
        
        // Get event details
        const eventDetails = await eventManager.getEventDetails(0);
        console.log("\nEvent #0 Current Status:");
        console.log("------------------------");
        console.log("Name:", eventDetails.name);
        console.log("Booked Count:", eventDetails.bookedCount.toString());
        console.log("Remaining Capacity:", 
            (eventDetails.maxCapacity - eventDetails.bookedCount).toString());
        console.log("Is Active:", eventDetails.isActive);

        // Check token 1 status
        const bookings = await eventManager.getTokenBookings(1);
        console.log("\nToken #1 Booking Status:");
        console.log("------------------------");
        console.log("Total Bookings:", bookings.length);
        console.log("Active Bookings:", 
            bookings.filter(b => b.isActive).length);
        console.log("Available Entrances:", 
            (await eventManager.getAvailableEntrances(1)).toString());

        // Detailed booking information
        console.log("\nDetailed Bookings:");
        bookings.forEach((booking, index) => {
            console.log(`\nBooking #${index}:`);
            console.log("Event ID:", booking.eventId.toString());
            console.log("Entrance Number:", booking.entranceNumber.toString());
            console.log("Status:", booking.isActive ? "Active" : "Cancelled");
        });

    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
    