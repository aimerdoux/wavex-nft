'use client';

import { useState } from 'react';
import { useWeb3Store } from '@/store/web3/web3Store';
import Image from 'next/image';

export default function MintPage() {
  const { isConnected } = useWeb3Store();
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const templates = [
    {
      id: 1,
      name: 'VIP Event Pass',
      description: 'Grant exclusive access to premium events',
      image: 'https://picsum.photos/800/600?random=10',
      price: '0.1',
      features: ['Event Access', 'Special Perks', 'Community Status'],
    },
    {
      id: 2,
      name: 'Digital Collectible',
      description: 'Own a piece of digital art history',
      image: 'https://picsum.photos/800/600?random=11',
      price: '0.05',
      features: ['Unique Artwork', 'Tradeable', 'Provable Ownership'],
    },
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 mb-8">
            Please connect your wallet to mint NFTs
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Mint Your NFT
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose a template below to mint your unique NFT. Each template offers
            different benefits and features.
          </p>
        </div>

        {/* Template Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 ${
                selectedTemplate === template.id
                  ? 'ring-2 ring-blue-500'
                  : ''
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <div className="relative h-64 w-full">
                <Image
                  src={template.image}
                  alt={template.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {template.name}
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {template.price} MATIC
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{template.description}</p>
                <div className="space-y-2">
                  {template.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <svg
                        className="h-5 w-5 text-green-500 mr-2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mint Button */}
        <div className="text-center">
          <button
            className={`px-8 py-3 text-lg font-semibold rounded-lg ${
              selectedTemplate
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } transition-colors`}
            disabled={!selectedTemplate || isUploading}
            onClick={() => {
              // Mint logic would go here
              alert('Minting functionality will be implemented soon!');
            }}
          >
            {isUploading ? 'Processing...' : 'Mint NFT'}
          </button>
          <p className="mt-4 text-sm text-gray-500">
            Gas fees will be calculated at the time of minting
          </p>
        </div>
      </div>
    </div>
  );
}