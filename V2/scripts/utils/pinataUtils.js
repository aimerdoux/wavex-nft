const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config({ path: 'V2.env' });

class PinataManager {
    constructor() {
        this.apiKey = process.env.PINATA_API_KEY;
        this.apiSecret = process.env.PINATA_API_SECRET;
        this.jwt = process.env.PINATA_JWT;

        if (!this.apiKey || !this.apiSecret) {
            throw new Error('Pinata API key and secret are required');
        }
    }

    async uploadJSON(jsonData, name) {
        try {
            const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
            const response = await axios.post(
                url,
                {
                    pinataMetadata: {
                        name: name
                    },
                    pinataContent: jsonData
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'pinata_api_key': this.apiKey,
                        'pinata_secret_api_key': this.apiSecret
                    }
                }
            );
            return response.data.IpfsHash;
        } catch (error) {
            console.error('Error uploading to Pinata:', error);
            throw error;
        }
    }

    async uploadFile(filePath, name) {
        try {
            const formData = new FormData();
            const file = fs.createReadStream(filePath);
            
            formData.append('file', file);
            formData.append('pinataMetadata', JSON.stringify({
                name: name
            }));

            const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
            const response = await axios.post(
                url,
                formData,
                {
                    maxBodyLength: Infinity,
                    headers: {
                        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                        'pinata_api_key': this.apiKey,
                        'pinata_secret_api_key': this.apiSecret
                    }
                }
            );
            return response.data.IpfsHash;
        } catch (error) {
            console.error('Error uploading file to Pinata:', error);
            throw error;
        }
    }

    getIPFSUrl(hash) {
        return `ipfs://${hash}`;
    }
}

// Export functions that will be used by other scripts
async function uploadToIPFS(content, filename) {
    const pinata = new PinataManager();
    
    if (typeof content === 'string') {
        // If content is a string, assume it's JSON
        try {
            const jsonContent = JSON.parse(content);
            return await pinata.uploadJSON(jsonContent, filename);
        } catch {
            // If not valid JSON, treat as file path
            return await pinata.uploadFile(content, filename);
        }
    } else {
        // If content is an object, upload as JSON
        return await pinata.uploadJSON(content, filename);
    }
}

module.exports = {
    PinataManager,
    uploadToIPFS
};