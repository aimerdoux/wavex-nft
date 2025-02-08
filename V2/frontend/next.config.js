/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'ipfs.io',
      'wavex-nft.storage.googleapis.com'
    ]
  },
  env: {
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
    NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY: process.env.MAGIC_PUBLISHABLE_KEY,
    NEXT_PUBLIC_MOONPAY_API_KEY: process.env.MOONPAY_API_KEY,
    NEXT_PUBLIC_API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
    NEXT_PUBLIC_CHAIN_ID: process.env.CHAIN_ID || '80001',
    NEXT_PUBLIC_RPC_URL: process.env.RPC_URL || 'https://rpc-mumbai.maticvigil.com'
  },
  experimental: {
    appDir: true,
  }
};

module.exports = nextConfig;