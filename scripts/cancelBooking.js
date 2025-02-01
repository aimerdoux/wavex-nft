// scripts/cancelBooking.js
//npx hardhat run scripts/cancelBooking.js --network polygonAmoy
const hre = require("hardhat");
require('dotenv').config();

async function main() {
  try {
    const tokenId = process.env.BOOKING_TOKEN_ID;
    const eventId = process.env.EVENT_ID;
    const eventManagerAddress = process.env.EVENT_MANAGER_ADDRESS;

    console.log("EventManager Address:", eventManagerAddress);
    console.log("Cancelling booking for Token ID:", tokenId);
    console.log("Event ID:", eventId);

    const WaveXEventManager = await hre.ethers.getContractFactory("WaveXEventManager");
    const eventManager = WaveXEventManager.attach(eventManagerAddress);

    // Check current booking status
    const isBooked = await eventManager.nftEventBookings(tokenId, eventId);
    console.log("\nCurrent Booking Status:");
    console.log(`Token ${tokenId} is${isBooked ? '' : ' not'} booked for event ${eventId}`);

    if (isBooked) {
      console.log("\nCanceling booking...");
      const tx = await eventManager.cancelBooking(tokenId, eventId, {
        gasLimit: 500000
      });

      console.log("Waiting for confirmation...");
      await tx.wait();
      console.log("Booking cancelled successfully!");

      // Get updated event details
      const event = await eventManager.getEventDetails(eventId);
      console.log("\nUpdated Event Details:");
      console.log("Name:", event.name);
      console.log("Booked Count:", event.bookedCount.toString());
      console.log("Max Capacity:", event.maxCapacity.toString());
    } else {
      console.log("No booking found to cancel.");
    }

  } catch (error) {
    console.error("\nError:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error);