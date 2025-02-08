// scripts/balance/topUpBalance.js
const hre = require("hardhat");
const { checkBalance } = require('./checkBalance');

/**
 * Tops up a token's balance
 * @param {Object} params Top-up parameters
 * @param {string|number} params.tokenId Token ID to top up
 * @param {string} params.amount Amount to top up in ETH/tokens
 * @param {string} [params.paymentToken] Optional ERC20 token address for USDT/USDC
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Top-up result
 */
async function topUpBalance(params, options = {}) {
    try {
        if (!params.tokenId || !params.amount) {
            throw new Error("Token ID and amount are required");
        }

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get initial balance
        const initialBalance = await checkBalance(params.tokenId);

        let tx;
        if (params.paymentToken) {
            // ERC20 top-up (USDT/USDC)
            const ERC20 = await hre.ethers.getContractFactory("IERC20");
            const token = ERC20.attach(params.paymentToken);

            // Check if token is supported
            const isSupported = await wavexNFT.supportedTokens(params.paymentToken);
            if (!isSupported) {
                throw new Error(`Token ${params.paymentToken} is not supported`);
            }

            // Check allowance
            const signer = wavexNFT.signer;
            const signerAddress = await signer.getAddress();
            const amount = hre.ethers.parseEther(params.amount);
            const allowance = await token.allowance(signerAddress, contractAddress);

            if (allowance < amount) {
                console.log("Approving token transfer...");
                const approveTx = await token.approve(contractAddress, amount);
                await approveTx.wait();
            }

            // Top up with ERC20
            console.log(`Topping up token ${params.tokenId} with ${params.amount} tokens...`);
            tx = await wavexNFT.topUpBalance(
                params.tokenId,
                amount,
                params.paymentToken,
                {
                    gasLimit: options.gasLimit
                }
            );
        } else {
            // ETH top-up
            console.log(`Topping up token ${params.tokenId} with ${params.amount} ETH...`);
            tx = await wavexNFT.topUpBalance(
                params.tokenId,
                hre.ethers.parseEther("0"),
                hre.ethers.ZeroAddress,
                {
                    value: hre.ethers.parseEther(params.amount),
                    gasLimit: options.gasLimit
                }
            );
        }

        const receipt = await tx.wait();

        // Get updated balance
        const updatedBalance = await checkBalance(params.tokenId);

        // Find and parse the BalanceUpdated event
        const balanceUpdatedLog = receipt.logs.find(
            log => log.topics[0] === wavexNFT.interface.getEventTopic('BalanceUpdated')
        );

        let eventData = {};
        if (balanceUpdatedLog) {
            const parsedLog = wavexNFT.interface.parseLog(balanceUpdatedLog);
            eventData = {
                tokenId: parsedLog.args.tokenId.toString(),
                newBalance: hre.ethers.formatEther(parsedLog.args.newBalance),
                updateType: parsedLog.args.updateType
            };
        }

        return {
            tokenId: params.tokenId,
            amount: params.amount,
            paymentToken: params.paymentToken || 'ETH',
            initialBalance: initialBalance.balance,
            newBalance: updatedBalance.balance,
            transactionHash: receipt.transactionHash,
            event: eventData
        };

    } catch (error) {
        console.error("Error topping up balance:", error);
        throw error;
    }
}

/**
 * Batch tops up multiple tokens
 * @param {Array<Object>} topUps Array of top-up operations
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Batch results
 */
async function batchTopUp(topUps, options = {}) {
    try {
        if (!Array.isArray(topUps) || topUps.length === 0) {
            throw new Error("At least one top-up operation is required");
        }

        const results = await Promise.allSettled(
            topUps.map(params =>
                topUpBalance(params, options)
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
            totalOperations: topUps.length,
            successfulTopUps: successful.length,
            failedTopUps: results.length - successful.length,
            totalAmount: totalAmount.toString(),
            results: results.map(r => 
                r.status === 'fulfilled' ? r.value : {
                    tokenId: r.reason.tokenId,
                    success: false,
                    error: r.reason.message
                }
            )
        };

    } catch (error) {
        console.error("Error in batch top-up:", error);
        throw error;
    }
}

module.exports = {
    topUpBalance,
    batchTopUp
};