# WaveX NFT Project

## Project Overview
WaveX is an innovative NFT project designed to provide unique digital assets with special benefits including merchant allowances, yacht event access, and discounts.

## Current Development Status
- Smart Contract Deployed on Polygon Amoy Testnet
- Contract Address: `0xD718613a5463e99a5947D2AF37Ce50b6E8B126d9`
- Verified on Polygonscan

## Project Structure
```
wavex-nft/
│
├── contracts/
│   └── WaveXNFT.sol         # Main smart contract
│
├── scripts/
│   └── deploy.js            # Deployment script
│
├── test/                    # Test cases
│
├── hardhat.config.js        # Hardhat configuration
└── .env                     # Environment variables
```

## Key Features
- ERC721 NFT Standard
- Merchant Allowance System
- Yacht Event Access
- Benefit Redemption Mechanism
- Maximum Supply Limit (10,000 NFTs)

## Prerequisites
- Node.js (v14+ recommended)
- Hardhat
- Ethereum Wallet
- Polygon Amoy Testnet MATIC tokens

## Setup Instructions
1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Create a `.env` file with:
   ```
   ALCHEMY_API_KEY=your_alchemy_api_key
   PRIVATE_KEY=your_private_key
   POLYGONSCAN_API_KEY=your_polygonscan_api_key
   ```

## Development Roadmap
### Completed
- [x] Smart Contract Development
- [x] Deployment to Polygon Amoy Testnet
- [x] Contract Verification

### Upcoming Tasks
- [ ] Comprehensive Test Suite
- [ ] Frontend Development
- [ ] Merchant Portal Integration
- [ ] Additional Benefit Types
- [ ] Security Audit

## Deployment
```bash
# Compile contracts
npx hardhat compile

# Deploy to Polygon Amoy
npx hardhat run scripts/deploy.js --network polygonAmoy

# Verify contract
npx hardhat verify CONTRACT_ADDRESS --network polygonAmoy
```

## Testing
```bash
npx hardhat test
```

## Potential Improvements
1. Add more granular access controls
2. Implement royalty mechanisms
3. Create a marketplace for benefit trading
4. Develop comprehensive frontend
5. Add more sophisticated benefit redemption logic

## Security Considerations
- Never share private keys
- Use hardware wallets for mainnet deployment
- Conduct thorough security audits
- Implement additional access controls

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
MIT License

## Contact
Project Lead: @aimerdoux
```

## Version History
- v0.1.0: Initial deployment on Polygon Amoy Testnet
```
