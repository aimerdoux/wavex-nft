// scripts/balance/checkBalance.js
const hre = require("hardhat");

/**
 * Checks the balance of a specific token
 * @param {string|number} tokenId Token ID to check
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Balance information
 */
async function checkBalance(tokenId, options = {}) {
    try {
        if (!tokenId) {
            throw new Error("Token ID is required");
        }

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get token balance
        const balance = await wavexNFT.tokenBalance(tokenId);

        // Get token owner
        const owner = await wavexNFT.ownerOf(tokenId);

        // Get transaction history if requested
        let transactions = [];
        if (options.includeHistory) {
            const txCount = await wavexNFT.getTransactionCount(tokenId);
            
            for (let i = 0; i < txCount; i++) {
                const tx = await wavexNFT.getTransaction(tokenId, i);
                transactions.push({
                    timestamp: new Date(tx.timestamp.toNumber() * 1000).toISOString(),
                    merchant: tx.merchant,
                    amount: hre.ethers.formatEther(tx.amount),
                    type: tx.transactionType,
                    metadata: tx.metadata
                });
            }
        }

        // Get token events if requested
        let events = [];
        if (options.includeEvents) {
            const tokenEvents = await wavexNFT.getTokenEvents(tokenId);
            events = tokenEvents.map(e => e.toString());
        }

        // Format response
        const response = {
            tokenId: tokenId.toString(),
            owner,
            balance: hre.ethers.formatEther(balance),
            balanceWei: balance.toString(),
            lastChecked: new Date().toISOString()
        };

        if (options.includeHistory) {
            response.transactions = transactions;
            
            // Calculate statistics
            const stats = transactions.reduce((acc, tx) => {
                const amount = parseFloat(tx.amount);
                if (tx.type === 'TOPUP') {
                    acc.totalTopUps += amount;
                    acc.topUpCount++;
                } else if (tx.type === 'PAYMENT') {
                    acc.totalSpent += amount;
                    acc.paymentCount++;
                }
                return acc;
            }, {
                totalTopUps: 0,
                totalSpent: 0,
                topUpCount: 0,
                paymentCount: 0
            });

            response.statistics = stats;
        }

        if (options.includeEvents) {
            response.events = events;
        }

        return response;

    } catch (error) {
        if (error.message.includes("ERC721: invalid token ID")) {
            throw new Error(`Token ${tokenId} does not exist`);
        }
        console.error("Error checking balance:", error);
        throw error;
    }
}

/**
 * Batch checks balances for multiple tokens
 * @param {Array<string|number>} tokenIds Array of token IDs
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Batch balance information
 */
async function batchCheckBalance(tokenIds, options = {}) {
    try {
        if (!Array.isArray(tokenIds) || tokenIds.length === 0) {
            throw new Error("At least one token ID is required");
        }

        const results = await Promise.allSettled(
            tokenIds.map(tokenId =>
                checkBalance(tokenId, options)
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

        // Calculate totals
        const successfulChecks = results.filter(r => r.value.success);
        const totalBalance = successfulChecks.reduce(
            (sum, r) => sum + parseFloat(r.value.details.balance),
            0
        );

        return {
            totalTokens: tokenIds.length,
            successfulChecks: successfulChecks.length,
            failedChecks: results.length - successfulChecks.length,
            totalBalance: totalBalance.toString(),
            averageBalance: (totalBalance / successfulChecks.length).toString(),
            results: results.map(r => r.value)
        };

    } catch (error) {
        console.error("Error in batch balance check:", error);
        throw error;
    }
}

module.exports = {
    checkBalance,
    batchCheckBalance
};