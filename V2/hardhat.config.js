require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config({ path: './V2.env' });  // Change this line

// Add 0x prefix to private key if not present
const PRIVATE_KEY = process.env.PRIVATE_KEY?.startsWith("0x") 
  ? process.env.PRIVATE_KEY 
  : `0x${process.env.PRIVATE_KEY}`;
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    polygonAmoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY],
      gasPrice: 35000000000
    }
  },
  etherscan: {
    apiKey: POLYGONSCAN_API_KEY
  }
};