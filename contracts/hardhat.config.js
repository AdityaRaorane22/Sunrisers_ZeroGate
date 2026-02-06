require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

// Ensure private key has 0x prefix
const privateKey = process.env.PRIVATE_KEY
  ? (process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY : `0x${process.env.PRIVATE_KEY}`)
  : '';

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
    sepolia: {
      url: process.env.RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY',
      accounts: privateKey ? [privateKey] : [],
      chainId: 11155111
    },
    localhost: {
      url: 'http://127.0.0.1:8545'
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};