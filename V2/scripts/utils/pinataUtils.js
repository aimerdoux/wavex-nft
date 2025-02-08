// scripts/utils/pinataUtils.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

class PinataManager {
    constructor() {
        this.apiKey = process.env.PINATA_API_KEY;
        this.apiSecret = process.env.PINATA_API_SECRET;
        this.jwt = process.env.PINATA_JWT;

        if (!this.apiKey || !this.apiSecret) {
            throw new Error('Pinata API key and secret are required');
        }

        // Initialize axios instance with default config
        this.api = axios.create({
            baseURL: 'https://api.pinata.cloud',
            timeout: 30000,
            headers: {
                'pinata_api_key': this.apiKey,
                'pinata_secret_api_key': this.apiSecret
            }
        });
    }

    async testAuthentication() {
        try {
            await this.api.get('/data/testAuthentication');
            console.log('Pinata authentication successful');
            return true;
        } catch (error) {
            console.error('Pinata authentication failed:', error.message);
            throw new Error('Pinata authentication failed');
        }
    }

    async uploadJSON(jsonData, name) {
        try {
            console.log(`Uploading JSON data to Pinata with name: ${name}`);
            
            const response = await this.api.post(
                '/pinning/pinJSONToIPFS',
                {
                    pinataMetadata: {
                        name: name || 'wavex-metadata',
                        keyvalues: {
                            type: 'metadata',
                            timestamp: new Date().toISOString()
                        }
                    },
                    pinataContent: jsonData
                }
            );

            console.log('Upload successful. IPFS hash:', response.data.IpfsHash);
            return response.data.IpfsHash;
        } catch (error) {
            console.error('Error uploading JSON to Pinata:');
            console.error('- Message:', error.message);
            if (error.response) {
                console.error('- Status:', error.response.status);
                console.error('- Data:', error.response.data);
            }
            throw error;
        }
    }

    async uploadFile(filePath, name) {
        try {
            console.log(`Uploading file to Pinata: ${filePath}`);
            
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            const formData = new FormData();
            const file = fs.createReadStream(filePath);
            
            formData.append('file', file);
            formData.append('pinataMetadata', JSON.stringify({
                name: name || 'wavex-file',
                keyvalues: {
                    type: 'asset',
                    timestamp: new Date().toISOString()
                }
            }));

            const response = await this.api.post(
                '/pinning/pinFileToIPFS',
                formData,
                {
                    maxBodyLength: Infinity,
                    headers: {
                        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
                    }
                }
            );

            console.log('Upload successful. IPFS hash:', response.data.IpfsHash);
            return response.data.IpfsHash;
        } catch (error) {
            console.error('Error uploading file to Pinata:');
            console.error('- Message:', error.message);
            if (error.response) {
                console.error('- Status:', error.response.status);
                console.error('- Data:', error.response.data);
            }
            throw error;
        }
    }

    getIPFSUrl(hash) {
        if (!hash) {
            throw new Error('IPFS hash is required');
        }
        return `ipfs://${hash}`;
    }

    getGatewayUrl(hash) {
        if (!hash) {
            throw new Error('IPFS hash is required');
        }
        return `https://gateway.pinata.cloud/ipfs/${hash}`;
    }
}

async function uploadToIPFS(content, filename) {
    try {
        console.log('Initializing Pinata manager...');
        const pinata = new PinataManager();
        
        // Test authentication first
        await pinata.testAuthentication();
        
        console.log('Processing content for upload...');
        if (typeof content === 'string') {
            try {
                // Try to parse as JSON first
                const jsonContent = JSON.parse(content);
                console.log('Content identified as JSON, uploading...');
                const hash = await pinata.uploadJSON(jsonContent, filename);
                return hash;
            } catch (e) {
                // If not valid JSON, treat as file path
                console.log('Content identified as file path, uploading file...');
                const hash = await pinata.uploadFile(content, filename);
                return hash;
            }
        } else {
            // If content is an object, upload as JSON
            console.log('Content identified as object, uploading as JSON...');
            const hash = await pinata.uploadJSON(content, filename);
            return hash;
        }
    } catch (error) {
        console.error('Error in uploadToIPFS:');
        console.error('- Message:', error.message);
        console.error('- Stack:', error.stack);
        throw error;
    }
}

module.exports = {
    PinataManager,
    uploadToIPFS
};