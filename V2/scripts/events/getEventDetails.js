// scripts/events/getEventDetails.js
const hre = require("hardhat");
const { EVENT_TYPES } = require('../config/eventConfig');

/**
 * Retrieves detailed information about a specific event
 * @param {string|number} eventId The ID of the event to fetch
 * @returns {Promise<Object>} Event details
 */
async function getEventDetails(eventId) {
    try {
        if (!eventId) {
            throw new Error("Event ID is required");
        }

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get event details from contract
        const event = await wavexNFT.events(eventId);

        // Format event details
        const formattedEvent = {
            id: eventId,
            name: event.name,
            price: hre.ethers.formatEther(event.price),
            capacity: event.capacity.toString(),
            soldCount: event.soldCount.toString(),
            active: event.active,
            eventType: event.eventType.toString(),
            typeLabel: Object.keys(EVENT_TYPES)[event.eventType] || 'UNKNOWN'
        };

        // Calculate remaining capacity
        formattedEvent.remainingCapacity = (
            parseInt(formattedEvent.capacity) - 
            parseInt(formattedEvent.soldCount)
        ).toString();

        // Add availability status
        formattedEvent.status = formattedEvent.active ? 
            (parseInt(formattedEvent.remainingCapacity) > 0 ? 'AVAILABLE' : 'SOLD_OUT') : 
            'INACTIVE';

        console.log(`Event details for ID ${eventId}:`, formattedEvent);
        return formattedEvent;

    } catch (error) {
        if (error.message.includes("Event not found")) {
            console.error(`Event with ID ${eventId} does not exist`);
            return null;
        }
        console.error("Error fetching event details:", error);
        throw error;
    }
}

module.exports = {
    getEventDetails
};