# WaveX NFT Frontend

A modern, responsive frontend implementation for the WaveX NFT marketplace.

## Features Implemented

- 🎨 Modern, responsive UI using Tailwind CSS
- 🔗 Web3 integration with MetaMask
- 📱 Mobile-friendly design
- 🎯 Key pages:
  - Landing page with feature showcase
  - NFT Marketplace with grid layout
  - Profile page with user NFTs
  - Minting page with template selection

## Project Structure

```
src/
├── app/                    # Next.js 13 app directory
│   ├── marketplace/       # Marketplace page
│   ├── profile/          # User profile page
│   ├── mint/            # NFT minting page
│   ├── layout.tsx       # Root layout with header/footer
│   └── page.tsx         # Landing page
├── components/
│   ├── layout/          # Layout components
│   ├── marketplace/     # Marketplace components
│   └── web3/           # Web3 integration components
├── lib/
│   └── constants/      # Application constants
├── services/
│   ├── api/           # API integration
│   └── web3/         # Web3 services
├── store/
│   └── web3/        # Web3 state management
└── types/          # TypeScript type definitions
```

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Copy `.env.example` to `.env` and fill in:
- `NEXT_PUBLIC_CONTRACT_ADDRESS`: Deployed contract address
- `NEXT_PUBLIC_CHAIN_ID`: Network chain ID
- `NEXT_PUBLIC_RPC_URL`: RPC endpoint
- `NEXT_PUBLIC_API_BASE_URL`: Backend API URL

3. Run development server:
```bash
npm run dev
```

## Pushing Changes

1. Create a new branch:
```bash
git checkout -b feature/frontend-implementation
```

2. Add the new files:
```bash
git add V2/frontend/
```

3. Commit the changes:
```bash
git commit -m "feat: implement frontend with Next.js and Tailwind CSS

- Add marketplace page with NFT grid
- Add profile page with user NFTs
- Add minting page with template selection
- Implement Web3 integration with MetaMask
- Add responsive layout and navigation"
```

4. Push to remote:
```bash
git push origin feature/frontend-implementation
```

## Next Steps

1. Integrate with backend API endpoints
2. Add loading states and error handling
3. Implement NFT search and filtering
4. Add animations and transitions
5. Set up automated testing
6. Configure CI/CD pipeline

## Design Decisions

- Used Next.js 13 with App Router for modern React features and better SEO
- Implemented Tailwind CSS for rapid UI development and consistent styling
- Used Zustand for simple and efficient state management
- Created reusable components for NFT cards and UI elements
- Implemented responsive design with mobile-first approach
- Added Web3 integration with MetaMask for blockchain interactions

## Notes

- The frontend is currently using mock data for NFTs and user information
- Web3 integration is prepared but needs contract address configuration
- Environment variables need to be set before deployment
- Some features like search and filtering are prepared in UI but need backend integration