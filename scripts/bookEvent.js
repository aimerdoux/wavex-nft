// scripts/bookEvent.js
const hre = require("hardhat");
require('dotenv').config();

async function main() {
  try {
    // Get parameters from environment variables
    const tokenId = process.env.SINGLE_BENEFIT_TOKEN_ID;
    const eventId = process.env.EVENT_ID;
    const eventManagerAddress = process.env.EVENT_MANAGER_ADDRESS;

    console.log("EventManager Address:", eventManagerAddress);
    console.log("Booking for Token ID:", tokenId);
    console.log("Event ID:", eventId);

    const WaveXEventManager = await hre.ethers.getContractFactory("WaveXEventManager");
    const eventManager = WaveXEventManager.attach(eventManagerAddress);

    // Check available entrances before booking
    const availableEntrances = await eventManager.getAvailableEntrances(tokenId);
    console.log("\nAvailable entrances for token:", availableEntrances.toString());

    // Get event details before booking
    const eventBefore = await eventManager.getEventDetails(eventId);
    console.log("\nCurrent Event Details:");
    console.log("Name:", eventBefore.name);
    console.log("Location:", eventBefore.location);
    console.log("Date:", new Date(Number(eventBefore.date) * 1000).toLocaleString());
    console.log("Booked Count:", eventBefore.bookedCount.toString());
    console.log("Max Capacity:", eventBefore.maxCapacity.toString());
    console.log("Is Active:", eventBefore.isActive);

    // Check if token has already booked this event
    const existingBookings = await eventManager.getTokenBookings(tokenId);
    const hasActiveBooking = existingBookings.some(booking => 
      booking.isActive && booking.eventId.toString() === eventId.toString()
    );

    if (hasActiveBooking) {
      console.log("\nWarning: Token already has an active booking for this event");
    }

    console.log("\nAttempting to book entrance...");
    const tx = await eventManager.bookEntrance(
      tokenId,
      eventId,
      {
        gasLimit: 500000
      }
    );

    console.log("Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("Entrance booked! Transaction hash:", receipt.hash);

    // Get all booking details after successful booking
    const updatedBookings = await eventManager.getTokenBookings(tokenId);
    const latestBooking = updatedBookings[updatedBookings.length - 1];
    
    console.log("\nBooking Details:");
    console.log("Entrance Number:", latestBooking.entranceNumber.toString());
    console.log("Event ID:", latestBooking.eventId.toString());
    console.log("Is Active:", latestBooking.isActive);

    // Get updated event details
    const eventAfter = await eventManager.getEventDetails(eventId);
    console.log("\nUpdated Event Details:");
    console.log("Name:", eventAfter.name);
    console.log("Booked Count:", eventAfter.bookedCount.toString());
    console.log("Max Capacity:", eventAfter.maxCapacity.toString());
    
    // Check remaining entrances
    const remainingEntrances = await eventManager.getAvailableEntrances(tokenId);
    console.log("\nRemaining available entrances:", remainingEntrances.toString());

    // Check cancellation count
    const cancellations = await eventManager.getCancellationCount(tokenId, eventId);
    console.log("Cancellations for this event:", cancellations.toString());

  } catch (error) {
    console.error("\nError:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error);