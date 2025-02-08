export type UserType = 'admin' | 'merchant' | 'cashier' | 'user';

export interface User {
  id: string;
  address: string;
  email?: string;
  type: UserType;
  name?: string;
}

export interface NFTTemplate {
  id: number;
  name: string;
  description: string;
  image: string;
  price: string;
  benefits: string[];
  merchantId: string;
  supply: number;
  remaining: number;
}

export interface NFT {
  tokenId: number;
  templateId: number;
  owner: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
      trait_type: string;
      value: string;
    }>;
  };
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  price: string;
  capacity: number;
  remaining: number;
  templateId: number;
  merchantId: string;
}

export interface Merchant {
  id: string;
  name: string;
  address: string;
  email: string;
  verified: boolean;
  balance: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface TransactionResponse {
  hash: string;
  wait: () => Promise<any>;
}