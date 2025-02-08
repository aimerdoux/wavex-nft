const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { authorizeMerchant, revokeMerchant } = require("./authorizeMerchants");

const MERCHANTS_FILE = "merchants.json";
const MERCHANTS_PATH = path.join(__dirname, MERCHANTS_FILE);

async function loadMerchants() {
    try {
        const data = fs.readFileSync(MERCHANTS_PATH, "utf8");
        return JSON.parse(data);
    } catch (error) {
        if (error.code === "ENOENT") {
            return [];
        }
        throw error;
    }
}

async function saveMerchants(merchants) {
    fs.writeFileSync(MERCHANTS_PATH, JSON.stringify(merchants, null, 2));
}

async function addMerchant(merchantAddress, merchantData) {
    try {
        let merchants = await loadMerchants();
        
        // Check if merchant already exists
        const existing = merchants.find(m => m.address === merchantAddress);
        if (existing) {
            throw new Error(`Merchant ${merchantAddress} already exists`);
        }

        // Authorize the merchant on-chain
        const txHash = await authorizeMerchant(merchantAddress);

        // Add to merchant list
        merchants.push({
            address: merchantAddress,
            name: merchantData.name,
            email: merchantData.email,
            authorized: true,
            addedAt: new Date().toISOString()
        });

        await saveMerchants(merchants);

        return {
            txHash,
            merchant: {
                ...merchantData,
                address: merchantAddress
            }
        };
    } catch (error) {
        console.error(`Error adding merchant ${merchantAddress}:`, error);
        throw error;
    }
}

async function removeMerchant(merchantAddress) {
    try {
        let merchants = await loadMerchants();
        
        // Find merchant index
        const index = merchants.findIndex(m => m.address === merchantAddress);
        if (index === -1) {
            throw new Error(`Merchant ${merchantAddress} not found`);
        }

        // Revoke authorization
        const txHash = await revokeMerchant(merchantAddress);

        // Remove from list
        merchants.splice(index, 1);
        await saveMerchants(merchants);

        return { txHash };
    } catch (error) {
        console.error(`Error removing merchant ${merchantAddress}:`, error);
        throw error;
    }
}

async function updateMerchant(merchantAddress, updates) {
    try {
        let merchants = await loadMerchants();
        
        // Find merchant
        const index = merchants.findIndex(m => m.address === merchantAddress);
        if (index === -1) {
            throw new Error(`Merchant ${merchantAddress} not found`);
        }

        // Update merchant data
        merchants[index] = {
            ...merchants[index],
            ...updates
        };
        await saveMerchants(merchants);

        return merchants[index];
    } catch (error) {
        console.error(`Error updating merchant ${merchantAddress}:`, error);
        throw error;
    }
}

async function getMerchant(merchantAddress) {
    try {
        const merchants = await loadMerchants();
        const merchant = merchants.find(m => m.address === merchantAddress);
        if (!merchant) {
            throw new Error(`Merchant ${merchantAddress} not found`);
        }
        return merchant;
    } catch (error) {
        console.error(`Error getting merchant ${merchantAddress}:`, error);
        throw error;
    }
}

async function getAllMerchants() {
    try {
        return await loadMerchants();
    } catch (error) {
        console.error("Error loading merchants:", error);
        throw error;
    }
}

module.exports = {
    addMerchant,
    removeMerchant,
    updateMerchant,
    getMerchant,
    getAllMerchants
};
