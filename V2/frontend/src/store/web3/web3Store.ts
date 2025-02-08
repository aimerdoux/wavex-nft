import { create } from 'zustand';
import { ethers } from 'ethers';
import { ExternalProvider } from '@ethersproject/providers';
import { contractService } from '@/services/web3/contract';

interface Web3State {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.providers.JsonRpcSigner | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  mintFromTemplate: (templateId: number, price: string) => Promise<void>;
  getBalance: (address: string) => Promise<string>;
  getOwner: (tokenId: number) => Promise<string>;
  getTokenURI: (tokenId: number) => Promise<string>;
  transferNFT: (to: string, tokenId: number) => Promise<void>;
}

const createWeb3Store = (set: any) => ({
  isConnected: false,
  address: null,
  chainId: null,
  provider: null,
  signer: null,
  error: null,

  connect: async () => {
    try {
      if (!window.ethereum) {
        throw new Error('No Web3 provider found. Please install MetaMask.');
      }

      await contractService.connect();
      const provider = new ethers.providers.Web3Provider(window.ethereum as ExternalProvider);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      set({
        isConnected: true,
        address,
        chainId: network.chainId,
        provider,
        signer,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to connect wallet',
        isConnected: false,
        address: null,
        chainId: null,
        provider: null,
        signer: null,
      });
    }
  },

  disconnect: () => {
    set({
      isConnected: false,
      address: null,
      chainId: null,
      provider: null,
      signer: null,
      error: null,
    });
  },

  mintFromTemplate: async (templateId: number, price: string) => {
    try {
      const tx = await contractService.mintFromTemplate(templateId, price);
      await tx.wait();
    } catch (error: any) {
      set({ error: error.message || 'Failed to mint NFT' });
      throw error;
    }
  },

  getBalance: async (address: string) => {
    try {
      return await contractService.getBalance(address);
    } catch (error: any) {
      set({ error: error.message || 'Failed to get balance' });
      throw error;
    }
  },

  getOwner: async (tokenId: number) => {
    try {
      return await contractService.getOwner(tokenId);
    } catch (error: any) {
      set({ error: error.message || 'Failed to get owner' });
      throw error;
    }
  },

  getTokenURI: async (tokenId: number) => {
    try {
      return await contractService.getTokenURI(tokenId);
    } catch (error: any) {
      set({ error: error.message || 'Failed to get token URI' });
      throw error;
    }
  },

  transferNFT: async (to: string, tokenId: number) => {
    try {
      const tx = await contractService.transferNFT(to, tokenId);
      await tx.wait();
    } catch (error: any) {
      set({ error: error.message || 'Failed to transfer NFT' });
      throw error;
    }
  },
});

export const useWeb3Store = create<Web3State>(createWeb3Store);