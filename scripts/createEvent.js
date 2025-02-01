// scripts/createEvent.js
//npx hardhat run scripts/createEvent.js --network polygonAmoy
const hre = require("hardhat");
require('dotenv').config();

async function main() {
  try {
    // Check required environment variables
    const requiredEnvVars = [
      'EVENT_MANAGER_ADDRESS',
      'EVENT_NAME',
      'EVENT_LOCATION',
      'EVENT_DAYS_FROM_NOW',
      'EVENT_MAX_CAPACITY'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    const eventManagerAddress = process.env.EVENT_MANAGER_ADDRESS;
    console.log("EventManager Address:", eventManagerAddress);

    const WaveXEventManager = await hre.ethers.getContractFactory("WaveXEventManager");
    const eventManager = WaveXEventManager.attach(eventManagerAddress);

    // Event details from environment variables
    const eventName = process.env.EVENT_NAME;
    const location = process.env.EVENT_LOCATION;
    const daysFromNow = parseInt(process.env.EVENT_DAYS_FROM_NOW);
    const eventDate = Math.floor(Date.now() / 1000) + (daysFromNow * 24 * 60 * 60);
    const maxCapacity = parseInt(process.env.EVENT_MAX_CAPACITY);

    // Get current event count before creation
    const eventCountBefore = await eventManager.getEventCount();

    console.log("\nAttempting to create event with details:");
    console.log("Name:", eventName);
    console.log("Location:", location);
    console.log("Date:", new Date(eventDate * 1000).toLocaleString());
    console.log("Max Capacity:", maxCapacity);
    console.log("Days from now:", daysFromNow);

    // Create event
    console.log("\nSubmitting transaction...");
    const tx = await eventManager.createEvent(
      eventName,
      location,
      eventDate,
      maxCapacity,
      {
        gasLimit: 500000
      }
    );

    console.log("Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("Event created! Transaction hash:", receipt.hash);

    // Get the new event's details
    const event = await eventManager.getEventDetails(eventCountBefore);
    
    console.log("\nVerifying created event details:");
    console.log("Event ID:", event.eventId.toString());
    console.log("Name:", event.name);
    console.log("Location:", event.location);
    console.log("Date:", new Date(Number(event.date) * 1000).toLocaleString());
    console.log("Max Capacity:", event.maxCapacity.toString());
    console.log("Booked Count:", event.bookedCount.toString());
    console.log("Is Active:", event.isActive);

  } catch (error) {
    if (error.message.includes("Missing required environment variable")) {
      console.error("\nError:", error.message);
      console.log("\nPlease make sure your .env file contains the following variables:");
      console.log("EVENT_MANAGER_ADDRESS=<contract_address>");
      console.log('EVENT_NAME="Your Event Name"');
      console.log('EVENT_LOCATION="Event Location"');
      console.log("EVENT_DAYS_FROM_NOW=7");
      console.log("EVENT_MAX_CAPACITY=10");
    } else {
      console.error("\nError:", error);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error);