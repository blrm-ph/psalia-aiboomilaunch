import { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface Creative {
  id: string;
  file: File;
  preview: string;
  filename: string;
  is_ecommerce: boolean;
  highlighted_product: string;
  highlighted_product_image?: File;
  highlighted_product_preview?: string;
  platform: string;
}

interface CreativeUploaderProps {
  onScore: (creatives: Creative[]) => void;
  isLoading: boolean;
  hasBIP: boolean;
}

const PLATFORMS = [
  'Instagram Feed',
  'Instagram Story',
  'Instagram Reels',
  'Instagram Carousel',
  'Facebook Feed',
  'Facebook Story',
  'Facebook Reels',
  'TikTok Feed',
  'TikTok Story',
  'YouTube Shorts',
  'YouTube Pre-Roll',
  'YouTube Banner',
  'Twitter/X Feed',
  'Twitter/X Header',
  'LinkedIn Feed',
  'LinkedIn Banner',
  'Pinterest Pin',
  'Snapchat Story',
  'Web Hero Banner',
  'Web Square Banner',
  'Web Leaderboard',
  'Web Skyscraper',
  'Display Banner (300x250)',
  'Display Banner (728x90)',
  'Display Banner (160x600)',
  'Amazon PDP (Main Image)',
  'Amazon A+ Content',
  'Amazon Storefront',
  'Amazon Sponsored Brand',
  'Walmart Product Image',
  'Etsy Listing Image',
  'eBay Listing Image',
  'Shopify Product Image',
  'Email Header',
  'Email Banner',
  'SMS/MMS Creative'
];

export default function CreativeUploader({ onScore, isLoading, hasBIP }: CreativeUploaderProps) {
  const [creatives, setCreatives] = useState<Creative[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const newCreatives = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      filename: file.name,
      is_ecommerce: false,
      highlighted_product: '',
      platform: 'Instagram Feed'
    }));

    setCreatives([...creatives, ...newCreatives]);
  };

  const removeCreative = (id: string) => {
    const creative = creatives.find(c => c.id === id);
    if (creative) {
      URL.revokeObjectURL(creative.preview);
    }
    setCreatives(creatives.filter(c => c.id !== id));
  };

  const updateCreative = (id: string, field: keyof Creative, value: string | boolean) => {
    setCreatives(creatives.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const handleProductImageUpload = (id: string, file: File | null) => {
    if (!file) return;

    setCreatives(creatives.map(c => {
      if (c.id === id) {
        if (c.highlighted_product_preview) {
          URL.revokeObjectURL(c.highlighted_product_preview);
        }
        return {
          ...c,
          highlighted_product_image: file,
          highlighted_product_preview: URL.createObjectURL(file)
        };
      }
      return c;
    }));
  };

  const removeProductImage = (id: string) => {
    setCreatives(creatives.map(c => {
      if (c.id === id && c.highlighted_product_preview) {
        URL.revokeObjectURL(c.highlighted_product_preview);
        return {
          ...c,
          highlighted_product_image: undefined,
          highlighted_product_preview: undefined
        };
      }
      return c;
    }));
  };


  const handleScore = () => {
    if (creatives.length > 0 && hasBIP) {
      onScore(creatives);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <ImageIcon className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-semibold text-gray-800">
          Creative Scoring
        </h2>
      </div>

      <div className="mb-6">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
          </div>
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
        </label>
      </div>

      {creatives.length > 0 && (
        <div className="space-y-4 mb-6">
          {creatives.map((creative) => (
            <div key={creative.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <img
                    src={creative.preview}
                    alt={creative.filename}
                    className="w-24 h-24 object-cover rounded"
                  />
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filename
                    </label>
                    <input
                      type="text"
                      value={creative.filename}
                      onChange={(e) => updateCreative(creative.id, 'filename', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Platform
                    </label>
                    <select
                      value={creative.platform}
                      onChange={(e) => updateCreative(creative.id, 'platform', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      {PLATFORMS.map(platform => (
                        <option key={platform} value={platform}>{platform}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={creative.is_ecommerce}
                        onChange={(e) => updateCreative(creative.id, 'is_ecommerce', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        E-commerce Creative
                      </span>
                    </label>

                    <button
                      onClick={() => removeCreative(creative.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                      disabled={isLoading}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {creative.is_ecommerce && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Highlighted Product Image
                      </label>
                      {!creative.highlighted_product_preview ? (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                          <div className="flex flex-col items-center justify-center">
                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                            <p className="text-xs text-gray-600">Upload product image</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleProductImageUpload(creative.id, file);
                            }}
                            disabled={isLoading}
                          />
                        </label>
                      ) : (
                        <div className="relative inline-block">
                          <img
                            src={creative.highlighted_product_preview}
                            alt="Product"
                            className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            onClick={() => removeProductImage(creative.id)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            disabled={isLoading}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}


      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {creatives.length} creative{creatives.length !== 1 ? 's' : ''} ready to score
        </div>

        <button
          onClick={handleScore}
          disabled={creatives.length === 0 || !hasBIP || isLoading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scoring...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Score Creatives
            </>
          )}
        </button>
      </div>

      {!hasBIP && creatives.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Please save a Brand Interpretation Profile before scoring creatives.
          </p>
        </div>
      )}
    </div>
  );
}
