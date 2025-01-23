# WaveX NFT Project

## Project Overview
WaveX is an innovative NFT project designed to provide unique digital assets with special benefits including merchant allowances, yacht event access, and discounts. The project implements a sophisticated benefit management system where merchants can propose benefits for NFT collections, subject to admin approval.

## Current Development Status
- Smart Contract Deployed on Polygon Amoy Testnet
- Contract Address: `0xD718613a5463e99a5947D2AF37Ce50b6E8B126d9`
- Verified on Polygonscan
- Initial NFTs Minted: 5
- Benefit System: Implemented and Tested

## Project Structure
```
wavex-nft/
│
├── contracts/
│   └── WaveXNFT.sol         # Main smart contract
│
├── scripts/
│   ├── deploy.js            # Deployment script
│   ├── mintNFTs.js          # NFT minting script
│   ├── checkNFTs.js         # NFT verification script
│   ├── addBenefits.js       # Benefit management script
│   └── testBenefits.js      # Benefit testing script
│
├── test/                    # Test cases
│
├── CONTRIBUTING.md          # Contribution guidelines
├── hardhat.config.js        # Hardhat configuration
└── .env                     # Environment variables
```

## Key Features
- ERC721 NFT Standard
- Merchant Allowance System
- Yacht Event Access
- Benefit Redemption Mechanism
- Maximum Supply Limit (10,000 NFTs)
- Batch Benefit Distribution
- Merchant Benefit Proposal System
- Admin Dashboard for Benefit Management

## Prerequisites
- Node.js (v14+ recommended)
- Hardhat
- Ethereum Wallet
- Polygon Amoy Testnet MATIC tokens

## Setup Instructions
1. Clone the repository
   ```bash
   git clone https://github.com/aimerdoux/wavex-nft
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
   ```

## Usage Guide

### Minting NFTs
```bash
# Mint NFTs
npx hardhat run scripts/mintNFTs.js --network polygonAmoy

# Verify minted NFTs
npx hardhat run scripts/checkNFTs.js --network polygonAmoy
```

### Managing Benefits
```bash
# Add benefits to NFTs
npx hardhat run scripts/addBenefits.js --network polygonAmoy

# Test benefit system
npx hardhat run scripts/testBenefits.js --network polygonAmoy
```

## Development Roadmap

### Completed
- [x] Smart Contract Development
- [x] Deployment to Polygon Amoy Testnet
- [x] Contract Verification
- [x] Initial NFT Minting
- [x] Basic Benefit System Implementation

### In Progress
- [ ] Merchant Benefit Proposal System
- [ ] Admin Dashboard Development
- [ ] Batch Benefit Distribution
- [ ] Enhanced Security Features

### Upcoming Tasks
- [ ] Frontend Development
- [ ] Merchant Portal Integration
- [ ] Additional Benefit Types
- [ ] Security Audit
- [ ] Marketplace Integration

## System Architecture

### Benefit Types
1. Merchant Allowance
   - Monetary value for use with participating merchants
   - Time-limited validity
   - Merchant verification system

2. Yacht Event Access
   - Exclusive event participation rights
   - Time-bound access tokens
   - Multiple access levels

3. Discounts
   - Percentage-based discounts
   - Fixed-amount discounts
   - Merchant-specific offers

### Merchant Integration
- Merchant authorization system
- Benefit proposal mechanism
- Request tracking and management
- Merchant dashboard for benefit management

### Admin Controls
- Benefit approval system
- Merchant authorization management
- Batch benefit distribution
- Request processing interface

## Security Considerations
- Role-based access control
- Benefit redemption verification
- Merchant authentication
- Time-bound benefit expiration
- Request validation and verification

## Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Testing
```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/WaveXNFT.test.js
```

## License
MIT License

## Contact
Project Lead: @aimerdoux

## Version History
- v0.1.0: Initial deployment on Polygon Amoy Testnet
- v0.1.1: Added NFT minting functionality
- v0.1.2: Implemented benefit management system
- v0.1.3: Added merchant benefit proposal system (in progress)

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
