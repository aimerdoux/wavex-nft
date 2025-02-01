// scripts/checkBookingStatus.js
const hre = require("hardhat");
require('dotenv').config();

async function main() {
  try {
    const tokenId = process.env.BOOKING_TOKEN_ID;
    const eventId = process.env.EVENT_ID;
    const eventManagerAddress = process.env.EVENT_MANAGER_ADDRESS;

    const WaveXEventManager = await hre.ethers.getContractFactory("WaveXEventManager");
    const eventManager = WaveXEventManager.attach(eventManagerAddress);

    // Get all bookings
    const bookings = await eventManager.getTokenBookings(tokenId);
    console.log("\nAll Bookings for Token", tokenId);
    console.log("Total bookings:", bookings.length);
    
    for(let i = 0; i < bookings.length; i++) {
      console.log(`\nBooking #${i}:`);
      console.log("Event ID:", bookings[i].eventId.toString());
      console.log("Is Active:", bookings[i].isActive);
      console.log("Entrance Number:", bookings[i].entranceNumber.toString());
    }

    // Get cancellation count
    const cancellations = await eventManager.getCancellationCount(tokenId, eventId);
    console.log("\nCancellation count for event", eventId, ":", cancellations.toString());

    // Get max cancellations allowed
    const maxCancellations = await eventManager.maxCancellationsAllowed();
    console.log("Max cancellations allowed:", maxCancellations.toString());

    // Check if token is still marked as booked for the event
    const isBooked = await eventManager.nftEventBookings(tokenId, eventId);
    console.log("\nToken is still marked as booked:", isBooked);

    // Get available entrances
    const availableEntrances = await eventManager.getAvailableEntrances(tokenId);
    console.log("Available entrances:", availableEntrances.toString());

  } catch (error) {
    console.error("\nError:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error);