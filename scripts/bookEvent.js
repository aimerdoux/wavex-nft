// scripts/bookEvent.js - Updated with your configuration
// npx hardhat run scripts/bookEvent.js --network polygonAmoy
const hre = require("hardhat");
require('dotenv').config();

async function main() {
  try {
    // Get parameters from environment variables
    const tokenId = process.env.SINGLE_BENEFIT_TOKEN_ID; // Using token ID 1 from your config
    const eventId = 0; // The event we created earlier
    const eventManagerAddress = process.env.EVENT_MANAGER_ADDRESS;

    console.log("EventManager Address:", eventManagerAddress);
    console.log("Booking for Token ID:", tokenId);
    console.log("Event ID:", eventId);

    const WaveXEventManager = await hre.ethers.getContractFactory("WaveXEventManager");
    const eventManager = WaveXEventManager.attach(eventManagerAddress);

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

    // Verify the booking
    const event = await eventManager.getEventDetails(eventId);
    console.log("\nUpdated Event Details:");
    console.log("Name:", event.name);
    console.log("Booked Count:", event.bookedCount.toString());
    console.log("Max Capacity:", event.maxCapacity.toString());
    
    // Check if the NFT is booked for this event
    const isBooked = await eventManager.nftEventBookings(tokenId, eventId);
    console.log("\nBooking Status:");
    console.log(`Token ${tokenId} is${isBooked ? '' : ' not'} booked for event ${eventId}`);

  } catch (error) {
    console.error("\nError:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error);