import { ethers } from 'ethers';
import { CONFIG } from '@/lib/constants/config';
import type { TransactionResponse } from '@/types';

// We'll need to import the ABI from our contract
const CONTRACT_ABI = [
  "function mintFromTemplate(uint256 templateId) external payable returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function approve(address to, uint256 tokenId) external",
  "function getApproved(uint256 tokenId) external view returns (address)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "function safeTransferFrom(address from, address to, uint256 tokenId) external",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data) external"
];

class ContractService {
  private provider: ethers.providers.Web3Provider | null = null;
  private contract: ethers.Contract | null = null;
  private signer: ethers.providers.JsonRpcSigner | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
    }
  }

  async connect(): Promise<void> {
    if (!this.provider) {
      throw new Error('No provider available');
    }

    await this.provider.send('eth_requestAccounts', []);
    this.signer = this.provider.getSigner();
    this.contract = new ethers.Contract(
      CONFIG.CONTRACT_ADDRESS,
      CONTRACT_ABI,
      this.signer
    );
  }

  async mintFromTemplate(templateId: number, price: string): Promise<TransactionResponse> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized');
    }

    const tx = await this.contract.mintFromTemplate(templateId, {
      value: ethers.utils.parseEther(price)
    });

    return tx;
  }

  async getBalance(address: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const balance = await this.contract.balanceOf(address);
    return balance.toString();
  }

  async getOwner(tokenId: number): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    return await this.contract.ownerOf(tokenId);
  }

  async getTokenURI(tokenId: number): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const uri = await this.contract.tokenURI(tokenId);
    return uri.toString();
  }

  async transferNFT(to: string, tokenId: number): Promise<TransactionResponse> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized');
    }

    const from = await this.signer.getAddress();
    const tx = await this.contract.transferFrom(from, to, tokenId);

    return tx;
  }

  async approveNFT(to: string, tokenId: number): Promise<TransactionResponse> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const tx = await this.contract.approve(to, tokenId);
    return tx;
  }

  async isApprovedForAll(owner: string, operator: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    return await this.contract.isApprovedForAll(owner, operator);
  }

  async setApprovalForAll(operator: string, approved: boolean): Promise<TransactionResponse> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const tx = await this.contract.setApprovalForAll(operator, approved);
    return tx;
  }

  getContractAddress(): string {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    return this.contract.address.toString();
  }

  isConnected(): boolean {
    return !!this.signer;
  }
}

export const contractService = new ContractService();