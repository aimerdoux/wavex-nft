import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WaveX NFT Marketplace',
  description: 'Buy, sell, and trade exclusive NFTs on WaveX',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">{children}</main>
          
          {/* Footer */}
          <footer className="bg-gray-800 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Company Info */}
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-xl font-bold mb-4">WaveX NFT</h3>
                  <p className="text-gray-300 mb-4">
                    The next generation of digital collectibles and experiences.
                    Join our community and discover unique NFTs.
                  </p>
                  <div className="flex space-x-4">
                    <a href="#" className="text-gray-300 hover:text-white">
                      Twitter
                    </a>
                    <a href="#" className="text-gray-300 hover:text-white">
                      Discord
                    </a>
                    <a href="#" className="text-gray-300 hover:text-white">
                      Telegram
                    </a>
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-gray-300 hover:text-white">
                        About Us
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-300 hover:text-white">
                        How It Works
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-300 hover:text-white">
                        FAQ
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-300 hover:text-white">
                        Support
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Legal */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Legal</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-gray-300 hover:text-white">
                        Terms of Service
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-300 hover:text-white">
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-300 hover:text-white">
                        Cookie Policy
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-700">
                <p className="text-center text-gray-400">
                  © {new Date().getFullYear()} WaveX NFT. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}