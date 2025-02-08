require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
if (!ALCHEMY_API_KEY) {
  throw new Error('Please set your ALCHEMY_API_KEY in .env');
}

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  throw new Error('Please set your PRIVATE_KEY in .env');
}

const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;
if (!POLYGONSCAN_API_KEY) {
  throw new Error('Please set your POLYGONSCAN_API_KEY in .env');
}

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1
      },
      evmVersion: "paris"
    }
  },
  networks: {
    polygonAmoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 80002,
      gas: "auto",
      gasPrice: 35000000000, // 35 gwei
      blockGasLimit: 12000000,
      allowUnlimitedContractSize: true,
      timeout: 60000,
      verify: {
        etherscan: {
          apiKey: POLYGONSCAN_API_KEY
        }
      }
    },
    hardhat: {
      chainId: 31337,
      gas: "auto",
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
        passphrase: ""
      }
    }
  },
  etherscan: {
    apiKey: {
      polygonAmoy: POLYGONSCAN_API_KEY
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com"
        }
      }
    ]
  },
  mocha: {
    timeout: 100000
  }
};
