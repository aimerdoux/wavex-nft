// scripts/metadata/updateNFT.js
const axios = require('axios');
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function uploadFileToPinata(filePath, fileName) {
    try {
        console.log(`\nUploading ${fileName} to Pinata...`);
        const form = new FormData();
        
        // Read file content
        const fileContent = fs.readFileSync(filePath);
        
        // Append the file to form data
        form.append('file', fileContent, {
            filename: fileName,
            contentType: 'image/jpeg'  // Set to image/jpeg for .jpg files
        });

        // Add metadata
        const metadata = JSON.stringify({
            name: `WaveX NFT Gold Card - ${fileName}`,
        });
        form.append('pinataMetadata', metadata);

        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'pinata_api_key': process.env.PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.PINATA_API_SECRET
                },
                maxContentLength: Infinity
            }
        );

        return {
            success: true,
            ipfsHash: response.data.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
        };
    } catch (error) {
        console.error('Error uploading file:', error.message);
        if (error.response) {
            console.error('Pinata response:', error.response.data);
        }
        return { success: false, error: error.message };
    }
}

async function uploadMetadataToPinata(metadata) {
    try {
        console.log('\nUploading metadata to Pinata...');
        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinJSONToIPFS',
            metadata,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': process.env.PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.PINATA_API_SECRET
                }
            }
        );
        return {
            success: true,
            ipfsHash: response.data.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
        };
    } catch (error) {
        console.error('Error uploading metadata:', error.message);
        return { success: false, error: error.message };
    }
}

async function verifyContent(url) {
    try {
        const response = await axios.get(url);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateNFT(tokenId, contractAddress, imagePath) {
    try {
        // Verify image exists
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image file not found at path: ${imagePath}`);
        }

        console.log('\nStarting NFT update process...');
        console.log('Image path:', imagePath);
        
        // 1. Upload Image
        console.log('\nStep 1: Uploading image...');
        const fileName = path.basename(imagePath);
        const imageResult = await uploadFileToPinata(imagePath, fileName);
        
        if (!imageResult.success) {
            throw new Error(`Failed to upload image: ${imageResult.error}`);
        }

        console.log('Image uploaded successfully!');
        console.log('IPFS Hash:', imageResult.ipfsHash);
        console.log('Gateway URL:', imageResult.url);

        // 2. Create and Upload Metadata
        console.log('\nStep 2: Creating and uploading metadata...');
        const metadata = {
            name: `WaveX NFT #${tokenId}`,
            description: "WaveX Luxury Experience NFT - Access exclusive benefits and experiences",
            image: `ipfs://${imageResult.ipfsHash}`,
            external_url: `https://wavex.com/nft/${tokenId}`,
            attributes: [
                {
                    trait_type: "Membership Tier",
                    value: "GOLD"
                },
                {
                    trait_type: "Card Type",
                    value: "Premium"
                },
                {
                    trait_type: "Valid Until",
                    value: "2025-12-31"
                }
            ]
        };

        const metadataResult = await uploadMetadataToPinata(metadata);
        if (!metadataResult.success) {
            throw new Error('Failed to upload metadata');
        }

        // 3. Update Contract
        console.log('\nStep 3: Updating contract...');
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFT");
        const contract = WaveXNFT.attach(contractAddress);

        const tx = await contract.setTokenURI(tokenId, `ipfs://${metadataResult.ipfsHash}`);
        console.log('Waiting for transaction confirmation...');
        await tx.wait();

        // 4. Verify Everything
        console.log('\nStep 4: Verifying uploads...');
        
        console.log('Checking image access...');
        const imageCheck = await axios.head(imageResult.url);
        const imageAccessible = imageCheck.status === 200;
        
        console.log('Checking metadata access...');
        const metadataCheck = await axios.get(metadataResult.url);
        const metadataAccessible = metadataCheck.status === 200;

        console.log('\nUpdate Summary:');
        console.log('===============');
        console.log('1. Image:');
        console.log('   IPFS Hash:', imageResult.ipfsHash);
        console.log('   Gateway URL:', imageResult.url);
        console.log('   Status:', imageAccessible ? 'Accessible ✓' : 'Not accessible ✗');
        
        console.log('\n2. Metadata:');
        console.log('   IPFS Hash:', metadataResult.ipfsHash);
        console.log('   Gateway URL:', metadataResult.url);
        console.log('   Status:', metadataAccessible ? 'Accessible ✓' : 'Not accessible ✗');
        
        console.log('\n3. Contract Update:');
        console.log('   Transaction Hash:', tx.hash);

        console.log('\nVerification Steps:');
        console.log('1. View image:', imageResult.url);
        console.log('2. View metadata:', metadataResult.url);
        console.log('3. View on OpenSea:', `https://testnets.opensea.io/assets/amoy/${contractAddress}/${tokenId}`);
        console.log('\nNote: Wait 5-10 minutes and refresh OpenSea metadata if needed');

        return {
            success: true,
            imageHash: imageResult.ipfsHash,
            metadataHash: metadataResult.ipfsHash,
            transactionHash: tx.hash
        };

    } catch (error) {
        console.error('\nError updating NFT:', error);
        throw error;
    }
}

// Execute if run directly
if (require.main === module) {
    const tokenId = "1";
    const contractAddress = "0x834CC08A746D9A08d013EEaBBe294786F1F2a917";
    const imagePath = path.join(__dirname, '../../assets/card-designs/gold/gold.jpg');  // Updated path

    updateNFT(tokenId, contractAddress, imagePath)
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    updateNFT,
    uploadFileToPinata,
    uploadMetadataToPinata,
    verifyContent
};