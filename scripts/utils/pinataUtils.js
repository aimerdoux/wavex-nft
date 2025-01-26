// scripts/utils/pinataUtils.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class PinataManager {
    constructor(apiKey, apiSecret, jwt) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.jwt = jwt;
        this.baseURL = 'https://api.pinata.cloud';
        this.gateway = 'https://gateway.pinata.cloud/ipfs';
    }

    async uploadJSON(jsonData, name) {
        try {
            const response = await axios.post(`${this.baseURL}/pinning/pinJSONToIPFS`, {
                pinataContent: jsonData,
                pinataMetadata: {
                    name: `${name}.json`
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.jwt}`
                }
            });

            return {
                IpfsHash: response.data.IpfsHash,
                PinSize: response.data.PinSize,
                Timestamp: response.data.Timestamp,
                url: `${this.gateway}/${response.data.IpfsHash}`
            };
        } catch (error) {
            console.error('Error uploading JSON to Pinata:', error.message);
            throw error;
        }
    }

    async uploadFile(filePath, name) {
        try {
            const formData = new FormData();
            
            const file = fs.createReadStream(filePath);
            formData.append('file', file);

            const metadata = JSON.stringify({
                name: name
            });
            formData.append('pinataMetadata', metadata);

            const response = await axios.post(`${this.baseURL}/pinning/pinFileToIPFS`, formData, {
                maxBodyLength: 'Infinity',
                headers: {
                    'Authorization': `Bearer ${this.jwt}`,
                    ...formData.getHeaders()
                }
            });

            return {
                IpfsHash: response.data.IpfsHash,
                PinSize: response.data.PinSize,
                Timestamp: response.data.Timestamp,
                url: `${this.gateway}/${response.data.IpfsHash}`
            };
        } catch (error) {
            console.error('Error uploading file to Pinata:', error.message);
            throw error;
        }
    }

    async uploadDirectory(dirPath, name) {
        try {
            // Create a readable stream of the directory
            const formData = new FormData();
            
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stream = fs.createReadStream(filePath);
                formData.append('file', stream, {
                    filepath: file
                });
            }

            const metadata = JSON.stringify({
                name: name
            });
            formData.append('pinataMetadata', metadata);

            const response = await axios.post(`${this.baseURL}/pinning/pinFileToIPFS`, formData, {
                maxBodyLength: 'Infinity',
                headers: {
                    'Authorization': `Bearer ${this.jwt}`,
                    ...formData.getHeaders()
                }
            });

            return {
                IpfsHash: response.data.IpfsHash,
                PinSize: response.data.PinSize,
                Timestamp: response.data.Timestamp,
                url: `${this.gateway}/${response.data.IpfsHash}`
            };
        } catch (error) {
            console.error('Error uploading directory to Pinata:', error.message);
            throw error;
        }
    }

    getIPFSUrl(hash) {
        return `${this.gateway}/${hash}`;
    }
}

module.exports = PinataManager;