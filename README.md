# WaveX NFT Project

## Project Overview
WaveX is an innovative NFT project designed to provide unique digital assets with special benefits including merchant allowances, yacht event access, and discounts. The project implements a sophisticated benefit management system where merchants can propose benefits for NFT collections, subject to admin approval.

## Current Development Status
- Smart Contract Deployed on Polygon Amoy Testnet
- Contract Address: `0x9EBCEB56bc3D83c52058d7770A360bA3DBCF3589`
- Verified on Polygonscan: [View Contract](https://amoy.polygonscan.com/address/0x9EBCEB56bc3D83c52058d7770A360bA3DBCF3589#code)
- Initial NFTs Minted and Testing Complete
- Benefit System: Implemented and Ready for Integration

## Project Structure
```
wavex-nft/
│
├── contracts/
│   └── WaveXNFT.sol         # Main smart contract
│
├── scripts/
│   ├── deploy.js            # Deployment script
│   ├── verify.js           # Contract verification script
│   ├── mint.js             # Single NFT minting script
│   ├── batchMint.js        # Batch minting script
│   ├── benefits/
│   │   ├── addBenefits.js   # Add benefits to tokens
│   │   ├── modifyBenefits.js # Modify existing benefits
│   │   └── getBenefits.js   # Query token benefits
│   ├── merchant/
│   │   ├── redeemBenefit.js # Process benefit redemption
│   │   └── verifyBenefit.js # Verify benefit validity
│   ├── metadata/
│   │   ├── updateBaseURI.js  # Update metadata base URI
│   │   └── generateMetadata.js # Generate token metadata
│   └── utils/
│       ├── config.js        # Configuration helpers
│       └── deployment.js    # Deployment helpers
│
├── test/
│   └── WaveXNFT-Suite.test.js # Comprehensive test suite
│
├── deployments/             # Deployment artifacts
├── CONTRIBUTING.md         # Contribution guidelines
├── hardhat.config.js       # Hardhat configuration
└── .env                    # Environment variables
```

## Key Features
- ERC721 NFT Standard with Enhanced Benefits
- Merchant Allowance System with Partial Redemption
- Event Access Management
- Benefit Redemption & Verification System
- Maximum Supply: 10,000 NFTs
- Batch Minting Support (up to 20 NFTs)
- Merchant Authorization System
- Admin Controls for Benefit Management

## Prerequisites
- Node.js (v18+ recommended)
- Hardhat
- Ethereum Wallet
- Polygon Amoy Testnet MATIC tokens

## Setup Instructions
1. Clone the repository
   ```bash
   git clone https://github.com/your-username/wavex-nft
   cd wavex-nft
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file with:
   ```
   ALCHEMY_API_KEY=your_alchemy_api_key
   PRIVATE_KEY=your_private_key
   POLYGONSCAN_API_KEY=your_polygonscan_api_key
   BASE_URI=your_metadata_base_uri
   INITIAL_MERCHANT=optional_merchant_address
   ```

## Usage Guide

### Deployment and Verification
```bash
# Deploy contract
npx hardhat run scripts/deploy.js --network polygonAmoy

# Verify contract (after waiting for propagation)
npx hardhat run scripts/verify.js --network polygonAmoy
```

### Minting NFTs
```bash
# Single mint
npx hardhat run scripts/mint.js --network polygonAmoy

# Batch mint
npx hardhat run scripts/batchMint.js --network polygonAmoy
```

### Managing Benefits (Coming Soon)
```bash
# Add benefits
npx hardhat run scripts/benefits/addBenefits.js --network polygonAmoy

# Modify benefits
npx hardhat run scripts/benefits/modifyBenefits.js --network polygonAmoy

# Query benefits
npx hardhat run scripts/benefits/getBenefits.js --network polygonAmoy
```

## Development Roadmap

### Completed
- [x] Smart Contract Development
- [x] Deployment to Polygon Amoy Testnet
- [x] Contract Verification
- [x] Minting System (Single & Batch)
- [x] Basic Benefit Structure

### In Progress
- [ ] Benefit Management Scripts
- [ ] Merchant Redemption System
- [ ] Metadata Management System
- [ ] Apple Wallet Integration

### Upcoming Tasks
- [ ] Frontend Development
- [ ] Merchant Portal
- [ ] Token Metadata & Visuals
- [ ] Security Audit
- [ ] Performance Optimization

## System Architecture

### Benefit Types
1. Merchant Allowance
   - Partial redemption support
   - Time-bound validity
   - Value tracking system

2. Event Access
   - Time-limited passes
   - Multi-tier access levels
   - Usage tracking

3. Discounts
   - Percentage & fixed-amount options
   - Merchant-specific redemption
   - Validity period management

### Metadata System (In Development)
- Prepaid Visa Card Token Integration
- NFT Card Image Generation
- Apple Wallet Pass Generation
- Transaction History Tracking
- Dynamic Metadata Updates

## Security Considerations
- Role-based Access Control
- Benefit Expiration Enforcement
- Merchant Authentication
- Redemption Verification
- Supply Limit Enforcement

## Testing
```bash
# Run all tests
npx hardhat test

# Run specific test suite
npx hardhat test test/WaveXNFT-Suite.test.js
```

## License
MIT License

## Contact
Project Lead: @aimerdoux

## Version History
- v0.1.0: Initial deployment on Polygon Amoy Testnet
- v0.1.1: Added minting functionality
- v0.1.2: Implemented verification system
- v0.1.3: Added benefit structure
- v0.1.4: Added batch minting capabilities

# Contributing to WaveX NFT Project

## Git Workflow Guide

### Making Changes

1. Before starting new work, ensure your local repository is up to date:
```bash
git pull origin main
```

2. Check the status of your changes:
```bash
git status
```
This will show:
- Modified files in red (unstaged changes)
- New files that aren't being tracked
- Staged files in green

### Committing Changes

1. Stage new files:
```bash
# Add specific files
git add path/to/file

# Examples:
git add scripts/mintNFTs.js
git add scripts/checkNFTs.js
git add scripts/addBenefits.js

# Add all new files in a directory
git add scripts/*.js

# Add all changes
git add .
```

2. Stage modified files:
```bash
git add hardhat.config.js
```

3. Create a commit with a descriptive message:
```bash
git commit -m "type: brief description"
```

### Commit Message Convention

Follow these types for your commit messages:
- `feat:` - New features (e.g., "feat: add NFT minting functionality")
- `fix:` - Bug fixes (e.g., "fix: resolve benefit redemption issue")
- `docs:` - Documentation changes (e.g., "docs: update setup instructions")
- `chore:` - Maintenance tasks (e.g., "chore: update dependencies")
- `refactor:` - Code refactoring (e.g., "refactor: optimize benefit distribution")
- `test:` - Adding or modifying tests (e.g., "test: add minting tests")
- `style:` - Code style changes (e.g., "style: format contract code")

Examples of good commit messages:
```bash
git commit -m "feat: implement NFT minting and benefit management"
git commit -m "fix: resolve gas optimization in batch minting"
git commit -m "docs: add contributing guidelines"
```

### Pushing Changes

1. Pull latest changes before pushing:
```bash
git pull origin main
```

2. Push your changes:
```bash
git push origin main
```

### Best Practices

1. **Frequent Commits**: Make small, focused commits rather than large ones
2. **Clear Messages**: Write descriptive commit messages
3. **Pull First**: Always pull before starting new work
4. **Review Changes**: Use `git status` and `git diff` before committing
5. **Branch When Needed**: Create feature branches for major changes

### Handling Merge Conflicts

If you encounter merge conflicts:

1. Identify conflicted files:
```bash
git status
```

2. Open each conflicted file and resolve conflicts
   - Look for sections marked with `<<<<<<<`, `=======`, and `>>>>>>>`
   - Choose which changes to keep
   - Remove conflict markers

3. Stage resolved files:
```bash
git add <resolved-file>
```

4. Complete the merge:
```bash
git commit -m "merge: resolve conflicts in benefit system"
```

### Additional Commands

Check commit history:
```bash
git log
```

View changes in a file:
```bash
git diff path/to/file
```

Discard changes in a file:
```bash
git checkout -- path/to/file
```

### Getting Help

- View command help: `git help <command>`
- Check command options: `git <command> --help`
- View command summary: `git <command> -h`

## Contact

If you have questions or need help:
- Open an issue on GitHub
- Contact the project maintainer: @aimerdoux

Remember to never commit sensitive information like private keys or API keys!
