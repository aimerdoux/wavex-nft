// scripts/events/validateEventAccess.js
const hre = require("hardhat");
const { getEventDetails } = require('./getEventDetails');

/**
 * Validates if a token has access to a specific event
 * @param {string|number} tokenId NFT token ID
 * @param {string|number} eventId Event ID
 * @returns {Promise<Object>} Validation result with details
 */
async function validateEventAccess(tokenId, eventId) {
    try {
        if (!tokenId || !eventId) {
            throw new Error("Token ID and Event ID are required");
        }

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get event details
        const event = await getEventDetails(eventId);
        if (!event) {
            return {
                valid: false,
                reason: "Event not found",
                details: null
            };
        }

        // Check if event is active
        if (!event.active) {
            return {
                valid: false,
                reason: "Event is not active",
                details: {
                    event,
                    tokenId
                }
            };
        }

        // Get token's events
        const tokenEvents = await wavexNFT.getTokenEvents(tokenId);
        const hasAccess = tokenEvents.map(e => e.toString()).includes(eventId.toString());

        if (!hasAccess) {
            return {
                valid: false,
                reason: "Token does not have access to this event",
                details: {
                    event,
                    tokenId,
                    tokenEvents: tokenEvents.map(e => e.toString())
                }
            };
        }

        // Get token balance
        const balance = await wavexNFT.tokenBalance(tokenId);

        // Build validation result
        const result = {
            valid: true,
            details: {
                event,
                tokenId,
                balance: hre.ethers.formatEther(balance),
                accessGranted: new Date().toISOString(),
                validationId: hre.ethers.id(
                    `${tokenId}-${eventId}-${Date.now()}`
                )
            }
        };

        console.log(`Access validated for token ${tokenId} to event ${eventId}`);
        return result;

    } catch (error) {
        if (error.message.includes("ERC721: invalid token ID")) {
            return {
                valid: false,
                reason: "Invalid token ID",
                details: { tokenId }
            };
        }

        console.error("Error validating event access:", error);
        throw error;
    }
}

/**
 * Batch validates event access for multiple tokens
 * @param {Array<string|number>} tokenIds Array of token IDs
 * @param {string|number} eventId Event ID
 * @returns {Promise<Object>} Batch validation results
 */
async function batchValidateEventAccess(tokenIds, eventId) {
    try {
        if (!Array.isArray(tokenIds) || tokenIds.length === 0) {
            throw new Error("At least one token ID is required");
        }

        const results = await Promise.all(
            tokenIds.map(async tokenId => ({
                tokenId,
                ...(await validateEventAccess(tokenId, eventId))
            }))
        );

        return {
            eventId,
            totalTokens: tokenIds.length,
            validTokens: results.filter(r => r.valid).length,
            invalidTokens: results.filter(r => !r.valid).length,
            results
        };

    } catch (error) {
        console.error("Error in batch validation:", error);
        throw error;
    }
}

module.exports = {
    validateEventAccess,
    batchValidateEventAccess
};