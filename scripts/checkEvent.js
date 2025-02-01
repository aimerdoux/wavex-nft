// scripts/checkEvent.js
//npx hardhat run scripts/checkEvent.js --network polygonAmoy
const hre = require("hardhat");
require('dotenv').config();

async function main() {
  try {
    const eventManagerAddress = process.env.EVENT_MANAGER_ADDRESS;
    console.log("EventManager Address:", eventManagerAddress);

    const WaveXEventManager = await hre.ethers.getContractFactory("WaveXEventManager");
    const eventManager = WaveXEventManager.attach(eventManagerAddress);

    // Get the number of events
    const eventCount = await eventManager.getEventCount();
    console.log("\nTotal Events Created:", eventCount.toString());

    // Get details for each event
    for(let i = 0; i < eventCount; i++) {
      console.log(`\nEvent #${i} Details:`);
      const event = await eventManager.getEventDetails(i);
      
      console.log("Event ID:", event.eventId.toString());
      console.log("Name:", event.name);
      console.log("Location:", event.location);
      console.log("Date:", new Date(Number(event.date) * 1000).toLocaleString());
      console.log("Max Capacity:", event.maxCapacity.toString());
      console.log("Booked Count:", event.bookedCount.toString());
      console.log("Is Active:", event.isActive);
    }

  } catch (error) {
    console.error("\nError:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error);