// scripts/events/purchaseEvent.js
const hre = require("hardhat");
const { getEventDetails } = require('./getEventDetails');
const { updateEventMetadata } = require('./eventMetadata');

/**
 * Purchase access to an event for a specific token
 * @param {string|number} tokenId NFT token ID
 * @param {string|number} eventId Event ID
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Purchase details
 */
async function purchaseEvent(tokenId, eventId, options = {}) {
    try {
        if (!tokenId || !eventId) {
            throw new Error("Token ID and Event ID are required");
        }

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get event details and validate
        const event = await getEventDetails(eventId);
        if (!event) {
            throw new Error(`Event ${eventId} not found`);
        }

        if (!event.active) {
            throw new Error(`Event ${eventId} is not active`);
        }

        if (parseInt(event.remainingCapacity) <= 0) {
            throw new Error(`Event ${eventId} is sold out`);
        }

        // Check token balance
        const balance = await wavexNFT.tokenBalance(tokenId);
        const price = hre.ethers.parseEther(event.price);

        if (balance < price) {
            throw new Error(
                `Insufficient balance. Required: ${event.price} ETH, Available: ${hre.ethers.formatEther(balance)} ETH`
            );
        }

        // Check if token already has access
        const tokenEvents = await wavexNFT.getTokenEvents(tokenId);
        if (tokenEvents.map(e => e.toString()).includes(eventId.toString())) {
            throw new Error(`Token ${tokenId} already has access to event ${eventId}`);
        }

        // Purchase event access
        console.log(`Purchasing access to event ${eventId} for token ${tokenId}...`);
        const tx = await wavexNFT.purchaseEventEntrance(
            tokenId,
            eventId,
            {
                gasLimit: options.gasLimit
            }
        );

        const receipt = await tx.wait();

        // Get updated event details
        const updatedEvent = await getEventDetails(eventId);

        // Update event metadata
        const metadataUpdates = {
            properties: {
                soldCount: updatedEvent.soldCount,
                remainingCapacity: updatedEvent.remainingCapacity,
                lastPurchase: new Date().toISOString()
            }
        };

        await updateEventMetadata(eventId, metadataUpdates);

        // Prepare purchase details
        const purchaseDetails = {
            tokenId: tokenId.toString(),
            eventId: eventId.toString(),
            price: event.price,
            purchaseDate: new Date().toISOString(),
            transactionHash: receipt.transactionHash,
            event: updatedEvent
        };

        // Find and parse the EventPurchased log
        const eventPurchasedLog = receipt.logs.find(
            log => log.topics[0] === wavexNFT.interface.getEventTopic('EventPurchased')
        );

        if (eventPurchasedLog) {
            const parsedLog = wavexNFT.interface.parseLog(eventPurchasedLog);
            purchaseDetails.logDetails = {
                tokenId: parsedLog.args.tokenId.toString(),
                eventId: parsedLog.args.eventId.toString()
            };
        }

        console.log(`Successfully purchased event access! Transaction: ${receipt.transactionHash}`);
        return purchaseDetails;

    } catch (error) {
        if (error.message.includes("ERC721: invalid token ID")) {
            throw new Error(`Invalid token ID: ${tokenId}`);
        }
        if (error.message.includes("Insufficient balance")) {
            throw new Error(`Insufficient balance for token ${tokenId}`);
        }
        console.error("Error purchasing event access:", error);
        throw error;
    }
}

/**
 * Batch purchase event access for multiple tokens
 * @param {Array<string|number>} tokenIds Array of token IDs
 * @param {string|number} eventId Event ID
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Batch purchase results
 */
async function batchPurchaseEvent(tokenIds, eventId, options = {}) {
    try {
        if (!Array.isArray(tokenIds) || tokenIds.length === 0) {
            throw new Error("At least one token ID is required");
        }

        const results = await Promise.allSettled(
            tokenIds.map(tokenId => 
                purchaseEvent(tokenId, eventId, options)
                    .then(result => ({
                        tokenId,
                        success: true,
                        details: result
                    }))
                    .catch(error => ({
                        tokenId,
                        success: false,
                        error: error.message
                    }))
            )
        );

        const successful = results.filter(r => r.value.success);
        const failed = results.filter(r => !r.value.success);

        return {
            eventId,
            totalAttempts: tokenIds.length,
            successfulPurchases: successful.length,
            failedPurchases: failed.length,
            results: results.map(r => r.value)
        };

    } catch (error) {
        console.error("Error in batch purchase:", error);
        throw error;
    }
}

module.exports = {
    purchaseEvent,
    batchPurchaseEvent
};