// scripts/balance/processPayment.js
const hre = require("hardhat");
const { checkBalance } = require('./checkBalance');

/**
 * Processes a payment from a token's balance
 * @param {Object} params Payment parameters
 * @param {string|number} params.tokenId Token ID to process payment from
 * @param {string} params.amount Amount to charge in ETH
 * @param {string} params.metadata Payment metadata (e.g., merchant reference, items)
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Payment result
 */
async function processPayment(params, options = {}) {
    try {
        if (!params.tokenId || !params.amount) {
            throw new Error("Token ID and amount are required");
        }

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Check if caller is authorized merchant
        const signer = wavexNFT.signer;
        const signerAddress = await signer.getAddress();
        const isAuthorized = await wavexNFT.authorizedMerchants(signerAddress);

        if (!isAuthorized) {
            throw new Error("Caller is not an authorized merchant");
        }

        // Get initial balance
        const initialBalance = await checkBalance(params.tokenId);
        const amount = hre.ethers.parseEther(params.amount);

        // Validate sufficient balance
        if (hre.ethers.parseEther(initialBalance.balance) < amount) {
            throw new Error(
                `Insufficient balance. Required: ${params.amount} ETH, Available: ${initialBalance.balance} ETH`
            );
        }

        // Process payment
        console.log(`Processing payment of ${params.amount} ETH from token ${params.tokenId}...`);
        const tx = await wavexNFT.processPayment(
            params.tokenId,
            amount,
            params.metadata || "",
            {
                gasLimit: options.gasLimit
            }
        );

        const receipt = await tx.wait();

        // Get updated balance
        const updatedBalance = await checkBalance(params.tokenId);

        // Find and parse relevant events
        const balanceUpdatedLog = receipt.logs.find(
            log => log.topics[0] === wavexNFT.interface.getEventTopic('BalanceUpdated')
        );

        const transactionRecordedLog = receipt.logs.find(
            log => log.topics[0] === wavexNFT.interface.getEventTopic('TransactionRecorded')
        );

        let eventData = {};
        if (balanceUpdatedLog) {
            const parsedLog = wavexNFT.interface.parseLog(balanceUpdatedLog);
            eventData.balance = {
                tokenId: parsedLog.args.tokenId.toString(),
                newBalance: hre.ethers.formatEther(parsedLog.args.newBalance),
                updateType: parsedLog.args.updateType
            };
        }

        if (transactionRecordedLog) {
            const parsedLog = wavexNFT.interface.parseLog(transactionRecordedLog);
            eventData.transaction = {
                tokenId: parsedLog.args.tokenId.toString(),
                transactionType: parsedLog.args.transactionType,
                amount: hre.ethers.formatEther(parsedLog.args.amount)
            };
        }

        return {
            tokenId: params.tokenId,
            amount: params.amount,
            merchant: signerAddress,
            metadata: params.metadata,
            initialBalance: initialBalance.balance,
            newBalance: updatedBalance.balance,
            transactionHash: receipt.transactionHash,
            events: eventData,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error("Error processing payment:", error);
        throw error;
    }
}

/**
 * Processes multiple payments in batch
 * @param {Array<Object>} payments Array of payment operations
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Batch results
 */
async function batchProcessPayments(payments, options = {}) {
    try {
        if (!Array.isArray(payments) || payments.length === 0) {
            throw new Error("At least one payment operation is required");
        }

        const results = await Promise.allSettled(
            payments.map(params =>
                processPayment(params, options)
                    .then(result => ({
                        tokenId: params.tokenId,
                        success: true,
                        details: result
                    }))
                    .catch(error => ({
                        tokenId: params.tokenId,
                        success: false,
                        error: error.message
                    }))
            )
        );

        // Calculate totals
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
        const totalAmount = successful.reduce(
            (sum, r) => sum + parseFloat(r.value.details.amount),
            0
        );

        return {
            totalOperations: payments.length,
            successfulPayments: successful.length,
            failedPayments: results.length - successful.length,
            totalAmount: totalAmount.toString(),
            timestamp: new Date().toISOString(),
            results: results.map(r => 
                r.status === 'fulfilled' ? r.value : {
                    tokenId: r.reason.tokenId,
                    success: false,
                    error: r.reason.message
                }
            )
        };

    } catch (error) {
        console.error("Error in batch payment processing:", error);
        throw error;
    }
}

module.exports = {
    processPayment,
    batchProcessPayments
};