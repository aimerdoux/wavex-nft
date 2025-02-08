// scripts/events/listEvents.js
const hre = require("hardhat");
const fs = require('fs').promises;
const path = require('path');
const { EVENT_CONFIG } = require('../config/eventConfig');
const { getEventDetails } = require('./getEventDetails');

/**
 * List all events with optional filtering and pagination
 * @param {Object} options Listing options
 * @param {boolean} options.activeOnly Only list active events
 * @param {boolean} options.availableOnly Only list events with remaining capacity
 * @param {number} options.eventType Filter by event type
 * @param {number} options.page Page number for pagination
 * @param {number} options.pageSize Number of events per page
 * @returns {Promise<Object>} List of events with pagination info
 */
async function listEvents(options = {}) {
    try {
        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Create events directory if it doesn't exist
        const eventsDir = path.join(process.cwd(), EVENT_CONFIG.eventsPath);
        await fs.mkdir(eventsDir, { recursive: true });

        // Load or initialize events tracking file
        const trackingFile = path.join(eventsDir, 'events_tracking.json');
        let tracking;
        try {
            const data = await fs.readFile(trackingFile, 'utf8');
            tracking = JSON.parse(data);
        } catch (error) {
            tracking = { lastUpdate: null, eventIds: [] };
        }

        // Get all events
        const events = [];
        const promises = tracking.eventIds.map(id => getEventDetails(id));
        const eventDetails = await Promise.all(promises);

        // Filter and sort events
        let filteredEvents = eventDetails.filter(event => event !== null);

        if (options.activeOnly) {
            filteredEvents = filteredEvents.filter(event => event.active);
        }

        if (options.availableOnly) {
            filteredEvents = filteredEvents.filter(
                event => event.active && parseInt(event.remainingCapacity) > 0
            );
        }

        if (typeof options.eventType === 'number') {
            filteredEvents = filteredEvents.filter(
                event => parseInt(event.eventType) === options.eventType
            );
        }

        // Sort by most recent first (assuming eventId contains timestamp)
        filteredEvents.sort((a, b) => parseInt(b.id) - parseInt(a.id));

        // Apply pagination
        const page = options.page || 1;
        const pageSize = options.pageSize || 10;
        const start = (page - 1) * pageSize;
        const paginatedEvents = filteredEvents.slice(start, start + pageSize);

        // Prepare response
        const response = {
            events: paginatedEvents,
            pagination: {
                total: filteredEvents.length,
                page,
                pageSize,
                totalPages: Math.ceil(filteredEvents.length / pageSize)
            },
            filters: {
                activeOnly: options.activeOnly || false,
                availableOnly: options.availableOnly || false,
                eventType: options.eventType
            }
        };

        // Save event IDs for future tracking
        const currentEventIds = new Set(tracking.eventIds);
        paginatedEvents.forEach(event => currentEventIds.add(event.id));
        tracking.eventIds = Array.from(currentEventIds);
        tracking.lastUpdate = new Date().toISOString();
        
        await fs.writeFile(trackingFile, JSON.stringify(tracking, null, 2));

        console.log(`Found ${response.pagination.total} events (showing page ${page} of ${response.pagination.totalPages})`);
        return response;

    } catch (error) {
        console.error("Error listing events:", error);
        throw error;
    }
}

module.exports = {
    listEvents
};