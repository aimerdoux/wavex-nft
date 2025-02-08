# WaveX NFT Solana Program

This is the Solana implementation of the WaveX NFT platform, migrated from Polygon. The program handles NFT minting, template management, event management, and balance tracking using Solana's native features and the Metaplex NFT standard.

## Prerequisites

- Rust (Latest stable version)
- Solana CLI tools
- Node.js (v16 or later)
- Anchor Framework
- Solana wallet with SOL for deployment and testing

## Setup Instructions

1. Install Rust:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

2. Install Solana CLI tools:
```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"
```

3. Install Anchor Framework:
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

4. Install project dependencies:
```bash
npm install
```

5. Configure Solana CLI:
```bash
solana config set --url localhost
solana-keygen new
```

## Development Workflow

1. Build the program:
```bash
anchor build
```

2. Run tests:
```bash
anchor test
```

3. Deploy to localnet:
```bash
anchor deploy
```

4. Deploy to devnet:
```bash
anchor deploy --provider.cluster devnet
```

## Program Structure

- `programs/wavex-nft/src/lib.rs`: Main program logic
- `tests/`: Test files
- `migrations/`: Deployment scripts
- `target/`: Build artifacts

## Key Features

1. Template Management
   - Create and manage NFT templates
   - Set base balance, price, and VIP status
   - Template metadata storage

2. Event Management
   - Create and manage events
   - Track capacity and sales
   - Event type categorization

3. NFT Minting
   - Mint from templates
   - Metaplex integration
   - Metadata handling

4. Balance Management
   - Track token balances
   - Process payments
   - Handle top-ups

## Testing

The test suite covers:
- Program initialization
- Template creation and management
- Event creation and management
- NFT minting process
- Balance operations
- Access control

Run tests with:
```bash
anchor test
```

## Security Considerations

1. Program Security
   - Proper PDA validation
   - Secure account management
   - Permission checks

2. Account Security
   - Protected account creation
   - Secure key management
   - Safe account closure

3. Data Security
   - Protected state transitions
   - Secure metadata handling
   - Balance protection

## Deployment

1. Local Development:
```bash
anchor localnet
```

2. Devnet Deployment:
```bash
anchor deploy --provider.cluster devnet
```

3. Mainnet Deployment:
```bash
anchor deploy --provider.cluster mainnet
```

## Integration

To integrate with the frontend:

1. Install dependencies:
```bash
npm install @solana/web3.js @solana/wallet-adapter-react
```

2. Configure connection:
```typescript
import { Connection } from '@solana/web3.js';
import { AnchorProvider } from '@project-serum/anchor';

const connection = new Connection('https://api.devnet.solana.com');
const provider = new AnchorProvider(connection, wallet, {});
```

3. Initialize program:
```typescript
import { Program } from '@project-serum/anchor';
import { WavexNft } from '../target/types/wavex_nft';

const program = new Program<WavexNft>(IDL, programID, provider);
```

## Contributing

1. Create a new branch for your feature
2. Write tests for new functionality
3. Ensure all tests pass
4. Submit a pull request

## License

MIT License