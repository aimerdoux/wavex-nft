export const ROUTES = {
  HOME: '/',
  MARKETPLACE: '/marketplace',
  PROFILE: '/profile',
  MINT: '/mint',
};

export const API_ENDPOINTS = {
  TEMPLATES: '/api/templates',
  EVENTS: '/api/events',
  MERCHANTS: '/api/merchants',
  MINT: '/api/mint',
  BALANCE: '/api/balance',
};

export const CONTRACT_CONFIG = {
  ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
};

export const AUTH_CONFIG = {
  MAGIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY,
};

export const PAYMENT_CONFIG = {
  MOONPAY_API_KEY: process.env.NEXT_PUBLIC_MOONPAY_API_KEY,
};

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
};