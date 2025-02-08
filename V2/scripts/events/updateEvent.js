// scripts/events/updateEvent.js
const hre = require("hardhat");
const { getEventDetails } = require('./getEventDetails');
const { EVENT_TYPES, getEventMetadata } = require('../config/eventConfig');
const { uploadToIPFS } = require('../utils/pinataUtils');

/**
 * Updates an existing event's details
 * @param {string|number} eventId The ID of the event to update
 * @param {Object} options Update options
 * @param {string} options.name New event name
 * @param {string} options.price New event price in ETH
 * @param {number} options.capacity New maximum capacity
 * @param {number} options.eventType New event type
 * @param {boolean} options.active Event active status
 * @param {Object} options.metadata Additional metadata to update
 * @returns {Promise<Object>} Updated event details
 */
async function updateEvent(eventId, options = {}) {
    try {
        if (!eventId) {
            throw new Error("Event ID is required");
        }

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get current event details
        const currentEvent = await getEventDetails(eventId);
        if (!currentEvent) {
            throw new Error(`Event with ID ${eventId} not found`);
        }

        // Prepare update parameters
        const updateParams = {
            name: options.name || currentEvent.name,
            price: options.price ? 
                hre.ethers.parseEther(options.price.toString()) : 
                hre.ethers.parseEther(currentEvent.price.toString()),
            capacity: options.capacity || currentEvent.capacity,
            eventType: typeof options.eventType === 'number' ? 
                options.eventType : 
                parseInt(currentEvent.eventType),
            active: typeof options.active === 'boolean' ? 
                options.active : 
                currentEvent.active
        };

        // Generate and upload new metadata if provided
        let metadataURI = currentEvent.metadataURI;
        if (options.metadata) {
            const metadata = await getEventMetadata(eventId, {
                name: updateParams.name,
                description: options.metadata.description,
                image: options.metadata.image,
                attributes: [
                    {
                        trait_type: "Type",
                        value: Object.keys(EVENT_TYPES)[updateParams.eventType]
                    },
                    {
                        trait_type: "Capacity",
                        value: updateParams.capacity.toString()
                    },
                    {
                        trait_type: "Price",
                        value: hre.ethers.formatEther(updateParams.price)
                    },
                    ...(options.metadata.attributes || [])
                ]
            });

            const newMetadataURI = await uploadToIPFS(JSON.stringify(metadata));
            metadataURI = `ipfs://${newMetadataURI}`;
        }

        // Update event on-chain
        const tx = await wavexNFT.updateEvent(
            eventId,
            updateParams.name,
            updateParams.price,
            updateParams.capacity,
            updateParams.eventType,
            updateParams.active,
            metadataURI,
            {
                gasLimit: options.gasLimit
            }
        );

        console.log(`Updating event ${eventId}...`);
        const receipt = await tx.wait();

        console.log(`Event updated successfully! Transaction: ${receipt.transactionHash}`);

        // Get and return updated event details
        const updatedEvent = await getEventDetails(eventId);
        return {
            ...updatedEvent,
            metadataURI,
            transactionHash: receipt.transactionHash
        };

    } catch (error) {
        console.error("Error updating event:", error);
        throw error;
    }
}

module.exports = {
    updateEvent
};