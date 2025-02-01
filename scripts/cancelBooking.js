// scripts/cancelBooking.js
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

    // Get all bookings for the token
    const bookings = await eventManager.getTokenBookings(tokenId);
    console.log("\nCurrent Bookings:", bookings.length);

    // Find the active booking for this event
    const bookingIndex = bookings.findIndex(booking => 
      booking.isActive && booking.eventId.toString() === eventId.toString()
    );

    if (bookingIndex === -1) {
      console.log("No active booking found for this event.");
      return;
    }

    // Get event details before cancellation
    const eventBefore = await eventManager.getEventDetails(eventId);
    console.log("\nCurrent Event Details:");
    console.log("Name:", eventBefore.name);
    console.log("Booked Count:", eventBefore.bookedCount.toString());
    console.log("Event Date:", new Date(Number(eventBefore.date) * 1000).toLocaleString());

    // Check if we're within the cancellation window (48 hours before event)
    const currentTime = Math.floor(Date.now() / 1000);
    const cancellationDeadline = Number(eventBefore.date) - (48 * 60 * 60);
    
    if (currentTime > cancellationDeadline) {
      console.log("\nWarning: Cancellation window has closed (must be 48 hours before event)");
      return;
    }

    console.log("\nCancelling booking...");
    console.log("Entrance Number:", bookingIndex);

    const tx = await eventManager.cancelBooking(
      tokenId, 
      eventId,
      bookingIndex,
      {
        gasLimit: 500000
      }
    );

    console.log("Waiting for confirmation...");
    await tx.wait();
    console.log("Booking cancelled successfully!");

    // Get updated event details
    const eventAfter = await eventManager.getEventDetails(eventId);
    console.log("\nUpdated Event Details:");
    console.log("Name:", eventAfter.name);
    console.log("Booked Count:", eventAfter.bookedCount.toString());
    console.log("Max Capacity:", eventAfter.maxCapacity.toString());

    // Get cancellation count
    const cancellations = await eventManager.getCancellationCount(tokenId, eventId);
    console.log("\nCancellation count for this event:", cancellations.toString());

  } catch (error) {
    console.error("\nError:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error);