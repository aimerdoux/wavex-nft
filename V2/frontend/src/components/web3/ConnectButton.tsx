'use client';

import React from 'react';
import { useWeb3Store } from '@/store/web3/web3Store';

interface ConnectButtonProps {
  className?: string;
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({ className = '' }) => {
  const { isConnected, address, connect, disconnect, error } = useWeb3Store();

  const handleClick = async () => {
    if (isConnected) {
      disconnect();
    } else {
      await connect();
    }
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        onClick={handleClick}
        className="px-4 py-2 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
        type="button"
      >
        {isConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
      </button>
      {address && (
        <p className="text-sm text-gray-600">
          Connected: {address.slice(0, 6)}...{address.slice(-4)}
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default ConnectButton;