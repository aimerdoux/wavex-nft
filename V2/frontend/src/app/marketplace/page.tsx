'use client';

import { ConnectButton } from '@/components/web3/ConnectButton';
import { NFTCard } from '@/components/marketplace/NFTCard';
import { useWeb3Store } from '@/store/web3/web3Store';

const mockNFTs = [
  {
    id: 1,
    name: 'WaveX VIP Pass',
    description: 'Exclusive access to premium events and special perks',
    image: 'https://picsum.photos/800/600?random=1',
    price: '0.1',
  },
  {
    id: 2,
    name: 'Digital Collectible',
    description: 'Limited edition digital artwork with unique properties',
    image: 'https://picsum.photos/800/600?random=2',
    price: '0.05',
  },
  {
    id: 3,
    name: 'Event Ticket NFT',
    description: 'Your gateway to exclusive live events and experiences',
    image: 'https://picsum.photos/800/600?random=3',
    price: '0.08',
  },
  {
    id: 4,
    name: 'Premium Access Pass',
    description: 'Unlock premium features and exclusive content',
    image: 'https://picsum.photos/800/600?random=4',
    price: '0.15',
  },
  {
    id: 5,
    name: 'Membership Token',
    description: 'Join our exclusive community of token holders',
    image: 'https://picsum.photos/800/600?random=5',
    price: '0.12',
  },
  {
    id: 6,
    name: 'Special Edition Pass',
    description: 'Limited time offer with unique benefits',
    image: 'https://picsum.photos/800/600?random=6',
    price: '0.2',
  },
];

export default function MarketplacePage() {
  const { isConnected, mintFromTemplate } = useWeb3Store();

  const handleMint = async (id: number, price: string) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    try {
      await mintFromTemplate(id, price);
      alert('NFT minted successfully!');
    } catch (error) {
      console.error('Minting failed:', error);
      alert('Failed to mint NFT. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            WaveX NFT Marketplace
          </h1>
          <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl">
            Discover and collect unique digital assets that unlock exclusive experiences
          </p>
          <ConnectButton className="mb-8" />
        </div>

        {/* Filters and Search (to be implemented) */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <select className="form-select rounded-lg border-gray-300">
              <option>All Categories</option>
              <option>VIP Passes</option>
              <option>Event Tickets</option>
              <option>Collectibles</option>
            </select>
            <select className="form-select rounded-lg border-gray-300">
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Latest</option>
            </select>
          </div>
          <div className="relative">
            <input
              type="search"
              placeholder="Search NFTs..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
        </div>

        {/* NFT Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockNFTs.map((nft) => (
            <NFTCard
              key={nft.id}
              {...nft}
              onMint={() => handleMint(nft.id, nft.price)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}