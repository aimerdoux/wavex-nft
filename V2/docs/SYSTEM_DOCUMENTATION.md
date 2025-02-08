# WaveX NFT V2 System Documentation

## Overview

WaveX NFT V2 is a comprehensive NFT system built on the Polygon network that introduces a balance-based membership system. The system replaces the traditional merchant allowance structure with a more robust WaveX Balance system, enabling seamless transactions and event access management.

## Core Features

1. **WaveX Balance System**
   - Built-in balance for each NFT
   - Top-up capability using USDT/USDC
   - Direct payment processing through authorized merchants
   - Transaction history tracking

2. **Template-Based NFT System**
   - Pre-defined templates (Gold, Platinum, Black, EventBrite)
   - Customizable template properties
   - Template-specific initial balances and prices
   - VIP status management

3. **Event Management**
   - Event creation and management
   - Capacity tracking
   - Multiple event types (Standard, VIP, Exclusive)
   - Event access validation

4. **Merchant Integration**
   - Authorized merchant system
   - Payment processing capabilities
   - Transaction history tracking
   - Merchant-specific metadata storage

## System Architecture

### Smart Contract (WaveXNFTV2.sol)
- ERC721-compliant NFT implementation
- Balance management system
- Event tracking functionality
- Merchant authorization system
- Template management

### Script Categories

1. **Deployment Scripts** (`scripts/deploy/`)
   - `deployV2.js`: Main contract deployment
   - `verifyContract.js`: Contract verification on Polygonscan
   - `setupTokens.js`: USDT/USDC token setup
   - `setupMerchants.js`: Merchant authorization setup

2. **Template Management** (`scripts/templates/`)
   - `createTemplate.js`: Create new templates
   - `updateTemplate.js`: Modify existing templates
   - `getTemplate.js`: Retrieve template details
   - `templateMetadata.js`: Template metadata management

3. **Event Management** (`scripts/events/`)
   - `createEvent.js`: Create new events
   - `updateEvent.js`: Modify event details
   - `listEvents.js`: List all events
   - `getEventDetails.js`: Get specific event details
   - `eventMetadata.js`: Event metadata management
   - `purchaseEvent.js`: Purchase event access
   - `validateEventAccess.js`: Validate event access

4. **NFT Minting** (`scripts/mint/`)
   - `mintFromTemplate.js`: Mint NFT from template
   - `batchMint.js`: Batch minting functionality
   - `validateMint.js`: Pre-mint validation

5. **Balance Management** (`scripts/balance/`)
   - `topUpBalance.js`: Add funds to NFT
   - `checkBalance.js`: Check NFT balance
   - `processPayment.js`: Process merchant payments
   - `validateBalance.js`: Validate balance operations

6. **Metadata Management** (`scripts/metadata/`)
   - `generateMetadata.js`: Generate NFT metadata
   - `uploadToIPFS.js`: Upload to IPFS via Pinata
   - `updateMetadata.js`: Update existing metadata
   - `validateMetadata.js`: Validate metadata structure

## Usage Guide

### 1. Initial Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Deploy contract
npx hardhat run scripts/deploy/deployV2.js --network polygon

# Setup system
npx hardhat run scripts/deploy/setupTokens.js --network polygon
npx hardhat run scripts/deploy/setupMerchants.js --network polygon
```

### 2. Template Management

```javascript
// Create a template
const template = await createTemplate(1, {
    name: "Gold",
    baseBalance: "2000",
    price: "2000",
    discount: 0,
    isVIP: false
});

// Update a template
await updateTemplate(1, {
    price: "2500",
    discount: 10
});
```

### 3. Event Management

```javascript
// Create an event
const event = await createEvent({
    name: "VIP Party",
    price: "100",
    capacity: 50,
    eventType: 1
});

// Purchase event access
await purchaseEvent({
    tokenId: "1",
    eventId: event.id
});
```

### 4. NFT Minting

```javascript
// Mint from template
const nft = await mintFromTemplate({
    templateId: 1,
    to: "0x...",
    metadata: {
        name: "Gold NFT #1",
        description: "First Gold NFT"
    }
});

// Batch mint
await batchMint({
    templateId: 1,
    recipients: ["0x...", "0x..."]
});
```

### 5. Balance Operations

```javascript
// Top up balance
await topUpBalance({
    tokenId: "1",
    amount: "1000",
    paymentToken: "0x..." // USDT address
});

// Process payment
await processPayment({
    tokenId: "1",
    amount: "500",
    metadata: "Purchase at Merchant #1"
});
```

## Testing

The system includes comprehensive testing capabilities:

```bash
# Run system test
npx hardhat run scripts/test/systemTest.js --network polygon

# Run specific component tests
npx hardhat test test/v2/Template.test.js
npx hardhat test test/v2/Event.test.js
npx hardhat test test/v2/Balance.test.js
```

## Security Considerations

1. **Access Control**
   - Only authorized merchants can process payments
   - Only contract owner can create/modify templates
   - Event access is strictly validated

2. **Balance Management**
   - Double-spending prevention
   - Safe math operations
   - Balance validation before transactions

3. **Metadata Security**
   - IPFS integration for decentralized storage
   - Metadata validation and sanitization
   - Proper URI handling

## Best Practices

1. **Transaction Handling**
   - Always validate inputs before transactions
   - Use batch operations for multiple items
   - Handle errors gracefully

2. **Metadata Management**
   - Store sensitive data off-chain
   - Use IPFS for immutable storage
   - Validate metadata structure

3. **Testing**
   - Run system tests before deployment
   - Validate all core functionalities
   - Test edge cases and error conditions

## Troubleshooting

Common issues and solutions:

1. **Transaction Failures**
   - Check gas settings
   - Verify balance sufficiency
   - Confirm merchant authorization

2. **Metadata Issues**
   - Verify IPFS connection
   - Check metadata format
   - Validate URI structure

3. **Balance Operations**
   - Confirm token approval
   - Check allowance settings
   - Verify merchant status

## Maintenance

Regular maintenance tasks:

1. **Contract Updates**
   - Monitor gas usage
   - Update merchant list
   - Adjust template parameters

2. **Data Management**
   - Archive old events
   - Update metadata
   - Monitor IPFS pins

3. **Security**
   - Regular audits
   - Permission checks
   - Transaction monitoring

## Support

For technical support:
1. Check the documentation
2. Review test cases
3. Contact system administrators

## Future Improvements

Planned enhancements:
1. Enhanced analytics
2. Additional template types
3. Advanced event features
4. Improved merchant interface