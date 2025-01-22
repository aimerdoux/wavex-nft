require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Only add polygonAmoy if we have the required environment variables
    ...(ALCHEMY_API_KEY && PRIVATE_KEY ? {
      polygonAmoy: {
        url: `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
        accounts: [PRIVATE_KEY]
      }
    } : {}),
    // Always include hardhat network
    hardhat: {
    }
  },
  // Only add etherscan config if we have the API key
  ...(POLYGONSCAN_API_KEY ? {
    etherscan: {
      apiKey: POLYGONSCAN_API_KEY
    }
  } : {})
};