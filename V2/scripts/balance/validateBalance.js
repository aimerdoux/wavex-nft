// scripts/balance/validateBalance.js
const hre = require("hardhat");
const { checkBalance } = require('./checkBalance');

/**
 * Validates a token's balance for specific operations
 * @param {Object} params Validation parameters
 * @param {string|number} params.tokenId Token ID to validate
 * @param {string} [params.requiredAmount] Required amount for operation
 * @param {string} [params.operation] Operation type (e.g., 'PAYMENT', 'EVENT')
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Validation result
 */
async function validateBalance(params, options = {}) {
    try {
        if (!params.tokenId) {
            throw new Error("Token ID is required");
        }

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get token details and balance
        const balanceInfo = await checkBalance(params.tokenId, {
            includeHistory: options.includeHistory,
            includeEvents: options.includeEvents
        });

        const validationResult = {
            tokenId: params.tokenId,
            currentBalance: balanceInfo.balance,
            timestamp: new Date().toISOString(),
            checks: {},
            valid: true,
            warnings: []
        };

        // Check if token exists
        validationResult.checks.exists = true;

        // Check owner
        validationResult.checks.owner = {
            address: balanceInfo.owner,
            valid: true
        };

        // Check required amount if specified
        if (params.requiredAmount) {
            const required = hre.ethers.parseEther(params.requiredAmount);
            const current = hre.ethers.parseEther(balanceInfo.balance);
            
            validationResult.checks.requiredAmount = {
                required: params.requiredAmount,
                sufficient: current >= required
            };

            if (!validationResult.checks.requiredAmount.sufficient) {
                validationResult.valid = false;
                validationResult.warnings.push(
                    `Insufficient balance. Required: ${params.requiredAmount} ETH, Available: ${balanceInfo.balance} ETH`
                );
            }
        }

        // Operation-specific validations
        if (params.operation) {
            switch (params.operation.toUpperCase()) {
                case 'PAYMENT':
                    // Check if token is allowed for payments
                    const paused = await wavexNFT.paused();
                    validationResult.checks.payment = {
                        allowed: !paused,
                        contractPaused: paused
                    };

                    if (paused) {
                        validationResult.valid = false;
                        validationResult.warnings.push("Contract is paused, payments not allowed");
                    }
                    break;

                case 'EVENT':
                    // Check if token has any conflicting events
                    if (balanceInfo.events) {
                        validationResult.checks.events = {
                            count: balanceInfo.events.length,
                            hasConflicts: false
                        };

                        if (options.eventId && balanceInfo.events.includes(options.eventId)) {
                            validationResult.checks.events.hasConflicts = true;
                            validationResult.valid = false;
                            validationResult.warnings.push("Token already has access to this event");
                        }
                    }
                    break;

                default:
                    validationResult.warnings.push(`Unknown operation type: ${params.operation}`);
            }
        }

        // Add transaction history analysis if requested
        if (options.includeHistory && balanceInfo.transactions) {
            const analysis = analyzeTransactionHistory(balanceInfo.transactions);
            validationResult.analysis = analysis;

            // Add warnings based on analysis
            if (analysis.unusualActivity) {
                validationResult.warnings.push("Unusual transaction activity detected");
            }
        }

        return validationResult;

    } catch (error) {
        console.error("Error validating balance:", error);
        throw error;
    }
}

/**
 * Analyzes transaction history for patterns and risks
 * @param {Array<Object>} transactions Transaction history
 * @returns {Object} Analysis results
 */
function analyzeTransactionHistory(transactions) {
    const analysis = {
        totalTransactions: transactions.length,
        topUps: 0,
        payments: 0,
        totalTopUpAmount: 0,
        totalSpentAmount: 0,
        averageTransactionSize: 0,
        unusualActivity: false,
        lastTransaction: null
    };

    if (transactions.length === 0) {
        return analysis;
    }

    // Analyze transactions
    transactions.forEach(tx => {
        const amount = parseFloat(tx.amount);
        if (tx.type === 'TOPUP') {
            analysis.topUps++;
            analysis.totalTopUpAmount += amount;
        } else if (tx.type === 'PAYMENT') {
            analysis.payments++;
            analysis.totalSpentAmount += amount;
        }
    });

    // Calculate averages
    analysis.averageTransactionSize = 
        (analysis.totalTopUpAmount + analysis.totalSpentAmount) / 
        analysis.totalTransactions;

    // Get last transaction
    analysis.lastTransaction = transactions[transactions.length - 1];

    // Check for unusual patterns
    const paymentFrequency = analysis.payments / Math.max(1, 
        (Date.now() - new Date(transactions[0].timestamp).getTime()) / (1000 * 60 * 60 * 24)
    );

    analysis.unusualActivity = 
        paymentFrequency > 10 || // More than 10 payments per day
        analysis.averageTransactionSize > 1000; // Average transaction > 1000 ETH

    return analysis;
}

/**
 * Batch validates balances for multiple tokens
 * @param {Array<Object>} validations Array of validation parameters
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Batch validation results
 */
async function batchValidateBalance(validations, options = {}) {
    try {
        if (!Array.isArray(validations) || validations.length === 0) {
            throw new Error("At least one validation is required");
        }

        const results = await Promise.allSettled(
            validations.map(params =>
                validateBalance(params, options)
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

        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
        const valid = successful.filter(r => r.value.details.valid);

        return {
            totalValidations: validations.length,
            successfulValidations: successful.length,
            validBalances: valid.length,
            invalidBalances: successful.length - valid.length,
            failedValidations: results.length - successful.length,
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
        console.error("Error in batch validation:", error);
        throw error;
    }
}

module.exports = {
    validateBalance,
    batchValidateBalance,
    analyzeTransactionHistory
};