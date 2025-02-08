import Image from 'next/image';
import { useState } from 'react';

interface NFTCardProps {
  id: number;
  name: string;
  description: string;
  image: string;
  price: string;
  onMint: () => void;
}

export const NFTCard: React.FC<NFTCardProps> = ({
  id,
  name,
  description,
  image,
  price,
  onMint,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-64 w-full">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300">
            <button
              onClick={onMint}
              className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
            >
              Mint for {price} MATIC
            </button>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <span className="text-sm font-medium text-blue-600">#{id}</span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-900">{price} MATIC</span>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Available
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};