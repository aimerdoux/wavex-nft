import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  QrCode,
  Clock, 
  Shield,
  Download,
  ExternalLink
} from 'lucide-react';
import { Alert, LoadingState } from './global-components';

const NFTPassGenerator = ({ 
  tokenId, 
  metadata,
  onPassGenerated,
  onError 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [passUrl, setPassUrl] = useState(null);
  const [error, setError] = useState(null);

  // Format metadata for pass generation
  const formatPassData = (metadata) => {
    return {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.wavex.nft",
      serialNumber: `WAVEX-${tokenId}`,
      teamIdentifier: "TEAM_ID", // Replace with actual Apple Team ID
      organizationName: "WaveX",
      description: metadata.description || `WaveX NFT #${tokenId}`,
      logoText: "WaveX",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(59, 130, 246)", // blue-500
      generic: {
        primaryFields: [
          {
            key: "tier",
            label: "MEMBERSHIP",
            value: metadata.attributes.find(
              attr => attr.trait_type === "Membership Tier"
            )?.value || "GOLD"
          }
        ],
        secondaryFields: [
          {
            key: "tokenId",
            label: "TOKEN ID",
            value: `#${tokenId}`
          },
          {
            key: "validUntil",
            label: "VALID UNTIL",
            value: metadata.attributes.find(
              attr => attr.trait_type === "Valid Until"
            )?.value || "2025-12-31"
          }
        ],
        auxiliaryFields: metadata.attributes
          .filter(attr => !["Membership Tier", "Valid Until"].includes(attr.trait_type))
          .map(attr => ({
            key: attr.trait_type.toLowerCase().replace(/\s+/g, '_'),
            label: attr.trait_type.toUpperCase(),
            value: attr.value
          }))
      }
    };
  };

  // Generate and download pass
  const generatePass = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const passData = formatPassData(metadata);
      
      // Call pass generation API
      const response = await fetch('/api/generate-pass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passData)
      });

      if (!response.ok) {
        throw new Error('Failed to generate pass');
      }

      const { passUrl } = await response.json();
      setPassUrl(passUrl);
      onPassGenerated?.(passUrl);

    } catch (err) {
      setError(err.message);
      onError?.(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Preview card component
  const PassPreview = () => (
    <div className="bg-blue-500 text-white rounded-xl p-6 space-y-4 max-w-sm mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold">WaveX</h3>
          <p className="text-sm opacity-75">NFT Membership Pass</p>
        </div>
        <Shield className="w-8 h-8" />
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs opacity-75">MEMBERSHIP TIER</p>
          <p className="font-bold">
            {metadata.attributes.find(
              attr => attr.trait_type === "Membership Tier"
            )?.value || "GOLD"}
          </p>
        </div>
        <div>
          <p className="text-xs opacity-75">TOKEN ID</p>
          <p className="font-mono">#{tokenId}</p>
        </div>
        <div>
          <p className="text-xs opacity-75">VALID UNTIL</p>
          <p>
            {metadata.attributes.find(
              attr => attr.trait_type === "Valid Until"
            )?.value || "2025-12-31"}
          </p>
        </div>
      </div>

      {metadata.image && (
        <div className="mt-4">
          <QrCode className="w-24 h-24 mx-auto opacity-75" />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <Alert 
          type="error" 
          message={error}
          onClose={() => setError(null)}
        />
      )}

      <PassPreview />

      <div className="space-y-4">
        <button
          onClick={generatePass}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Wallet className="w-5 h-5" />
          <span>Add to Apple Wallet</span>
        </button>

        {passUrl && (
          <button
            onClick={() => window.open(passUrl, '_blank')}
            className="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-5 h-5" />
            <span>Download Pass</span>
          </button>
        )}

        {isGenerating && <LoadingState text="Generating pass..." />}
      </div>

      <div className="text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Pass updates automatically when benefits change</span>
        </div>
      </div>
    </div>
  );
};

export default NFTPassGenerator;