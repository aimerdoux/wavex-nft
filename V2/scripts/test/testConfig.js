// scripts/test/testConfig.js

/**
 * Test configuration for WaveX V2 system
 */
const TEST_CONFIG = {
    // Network settings
    network: {
        name: "polygonAmoy",
        chainId: 80002, // Fixed: Changed from 80001 (Mumbai) to 80002 (Amoy)
        gasLimit: 5000000,
        gasPrice: "35000000000" // 35 gwei - Adjusted for Amoy testnet
    },

    // Template configurations
    templates: {
        gold: {
            id: 1,
            name: "Gold",
            baseBalance: "2000",
            price: "2000",
            discount: 0,
            isVIP: false,
            metadata: {
                description: "Gold tier membership",
                image: "ipfs://QmGoldTemplateHash"
            }
        },
        platinum: {
            id: 2,
            name: "Platinum",
            baseBalance: "5000",
            price: "5000",
            discount: 5,
            isVIP: false,
            metadata: {
                description: "Platinum tier membership",
                image: "ipfs://QmPlatinumTemplateHash"
            }
        },
        black: {
            id: 3,
            name: "Black",
            baseBalance: "10000",
            price: "10000",
            discount: 10,
            isVIP: true,
            metadata: {
                description: "Black tier membership",
                image: "ipfs://QmBlackTemplateHash"
            }
        },
        eventbrite: {
            id: 4,
            name: "EventBrite",
            baseBalance: "0",
            price: "0",
            discount: 0,
            isVIP: false,
            metadata: {
                description: "EventBrite integration template",
                image: "ipfs://QmEventBriteTemplateHash"
            }
        }
    },

    // Event configurations
    events: {
        standard: {
            name: "Standard Event",
            price: "50",
            capacity: 100,
            eventType: 0,
            metadata: {
                description: "Standard test event",
                image: "ipfs://QmStandardEventHash"
            }
        },
        vip: {
            name: "VIP Party",
            price: "100",
            capacity: 50,
            eventType: 1,
            metadata: {
                description: "VIP test event",
                image: "ipfs://QmVIPEventHash"
            }
        },
        exclusive: {
            name: "Exclusive Event",
            price: "200",
            capacity: 25,
            eventType: 2,
            metadata: {
                description: "Exclusive test event",
                image: "ipfs://QmExclusiveEventHash"
            }
        }
    },

    // Test accounts
    accounts: {
        owner: {
            address: process.env.MERCHANT_ADDRESS, // Contract owner
            privateKey: process.env.MERCHANT_ADMIN_KEY
        },
        merchants: [
            {
                name: "Test Merchant 1",
                address: process.env.MERCHANT_ADDRESS,
                privateKey: process.env.MERCHANT_ADMIN_KEY
            },
            {
                name: "Test Merchant 2",
                address: process.env.CASHIER1_ADDRESS,
                privateKey: process.env.MERCHANT_ADMIN_KEY
            }
        ],
        users: [
            {
                name: "Test User 1",
                address: process.env.MERCHANT_ADDRESS,
                privateKey: process.env.MERCHANT_ADMIN_KEY
            },
            {
                name: "Test User 2",
                address: process.env.CASHIER1_ADDRESS,
                privateKey: process.env.MERCHANT_ADMIN_KEY
            }
        ]
    },

    // Token configurations (USDT/USDC)
    tokens: {
        usdt: {
            address: process.env.USDT_CONTRACT_ADDRESS,
            decimals: 6
        },
        usdc: {
            address: process.env.USDC_CONTRACT_ADDRESS,
            decimals: 6
        }
    },

    // Test parameters
    testParams: {
        // Balance operations
        topUp: {
            amount: "1000",
            batchSize: 10
        },
        payment: {
            minAmount: "10",
            maxAmount: "1000",
            batchSize: 5
        },

        // Minting
        mint: {
            batchSize: 20,
            maxBatchSize: 50
        },

        // Events
        event: {
            minCapacity: 10,
            maxCapacity: 1000,
            batchPurchaseSize: 5
        },

        // Timeouts and delays
        timeouts: {
            transaction: 60000, // 1 minute
            confirmation: 5000,  // 5 seconds
            batchDelay: 1000    // 1 second
        }
    },

    // IPFS/Pinata settings
    ipfs: {
        gateway: "https://gateway.pinata.cloud/ipfs/",
        timeout: 30000 // 30 seconds
    }
};

// Helper functions
const getTemplateById = (id) => {
    return Object.values(TEST_CONFIG.templates).find(t => t.id === id);
};

const getRandomAmount = (min, max) => {
    min = parseFloat(min);
    max = parseFloat(max);
    return (Math.random() * (max - min) + min).toFixed(2);
};

const getTestAccount = (type, index = 0) => {
    const accounts = TEST_CONFIG.accounts[type];
    return Array.isArray(accounts) ? accounts[index] : accounts;
};

module.exports = {
    TEST_CONFIG,
    getTemplateById,
    getRandomAmount,
    getTestAccount
};