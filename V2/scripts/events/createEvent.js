// scripts/events/createEvent.js
const hre = require("hardhat");
const { EVENT_TYPES, getEventMetadata } = require('../config/eventConfig');
const { uploadToIPFS } = require('../utils/pinataUtils');

/**
 * Creates a new event on the WaveX platform
 * @param {Object} options Event creation options
 * @param {string} options.name Event name
 * @param {string} options.price Event price in ETH
 * @param {number} options.capacity Maximum event capacity
 * @param {number} options.eventType Event type (0: Standard, 1: VIP, 2: Exclusive)
 * @param {Object} options.metadata Additional metadata options
 * @returns {Promise<Object>} Created event details
 */
async function createEvent(options = {}) {
    try {
        // Validate required parameters
        if (!options.name || !options.price || !options.capacity) {
            throw new Error("Missing required parameters: name, price, and capacity are required");
        }

        // Generate and upload metadata
        const metadata = await getEventMetadata(Date.now(), {
            name: options.name,
            description: options.metadata?.description,
            image: options.metadata?.image,
            attributes: [
                {
                    trait_type: "Type",
                    value: Object.keys(EVENT_TYPES)[options.eventType || 0]
                },
                {
                    trait_type: "Capacity",
                    value: options.capacity.toString()
                },
                {
                    trait_type: "Price",
                    value: options.price.toString()
                },
                ...(options.metadata?.attributes || [])
            ]
        });

        const metadataURI = await uploadToIPFS(JSON.stringify(metadata));

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Create event on-chain
        const tx = await wavexNFT.createEvent(
            options.name,
            hre.ethers.parseEther(options.price.toString()),
            options.capacity,
            options.eventType || EVENT_TYPES.STANDARD,
            {
                gasLimit: options.gasLimit
            }
        );

        console.log(`Creating event: ${options.name}...`);
        const receipt = await tx.wait();
        
        // Parse event ID from logs
        const eventCreatedLog = receipt.logs.find(
            log => log.topics[0] === wavexNFT.interface.getEventTopic('EventCreated')
        );
        
        const eventId = eventCreatedLog ? 
            wavexNFT.interface.parseLog(eventCreatedLog).args.eventId : 
            null;

        console.log(`Event created successfully! Transaction: ${receipt.transactionHash}`);
        console.log(`Event ID: ${eventId}`);

        // Save event details to local storage
        const eventDetails = {
            id: eventId,
            name: options.name,
            price: options.price,
            capacity: options.capacity,
            eventType: options.eventType || EVENT_TYPES.STANDARD,
            metadataURI: `ipfs://${metadataURI}`,
            createdAt: new Date().toISOString(),
            transactionHash: receipt.transactionHash
        };

        return eventDetails;
    } catch (error) {
        console.error("Error creating event:", error);
        throw error;
    }
}

module.exports = {
    createEvent
};