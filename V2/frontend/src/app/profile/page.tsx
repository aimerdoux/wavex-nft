'use client';

import { useWeb3Store } from '@/store/web3/web3Store';
import { NFTCard } from '@/components/marketplace/NFTCard';

const mockUserNFTs = [
  {
    id: 1,
    name: 'VIP Event Pass #123',
    description: 'Access to exclusive WaveX community events',
    image: 'https://picsum.photos/800/600?random=7',
    price: '0.1',
  },
  {
    id: 2,
    name: 'Premium Collection #456',
    description: 'Limited edition digital artwork from top creators',
    image: 'https://picsum.photos/800/600?random=8',
    price: '0.15',
  },
];

export default function ProfilePage() {
  const { isConnected, address } = useWeb3Store();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 mb-8">
            Please connect your wallet to view your profile and NFTs
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-2xl text-white font-bold">
                {address ? address.slice(2, 4).toUpperCase() : '??'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600">
                {address
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : 'No address connected'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total NFTs</h3>
            <p className="text-3xl font-bold text-blue-600">
              {mockUserNFTs.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Total Value
            </h3>
            <p className="text-3xl font-bold text-blue-600">0.25 MATIC</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Joined Date
            </h3>
            <p className="text-3xl font-bold text-blue-600">Feb 2025</p>
          </div>
        </div>

        {/* NFTs Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">My NFTs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockUserNFTs.map((nft) => (
              <NFTCard
                key={nft.id}
                {...nft}
                onMint={() => {}} // No minting in profile view
              />
            ))}
          </div>
          {mockUserNFTs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No NFTs found in your collection</p>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Browse Marketplace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}