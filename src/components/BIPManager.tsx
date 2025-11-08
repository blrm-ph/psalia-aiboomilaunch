import { useState } from 'react';
import { FileText, Save, CheckCircle, Upload, X, Image as ImageIcon, Type } from 'lucide-react';

interface BIPManagerProps {
  onBIPSave: (bip: string) => void;
  currentBIP: string;
}

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  name: string;
}

interface BIPData {
  logoFiles: ImageFile[];
  toneOfVoiceMode: 'text' | 'images';
  toneOfVoiceText: string;
  toneOfVoiceImages: ImageFile[];
  preApprovedCreatives: ImageFile[];
  targetAudience: string;
  offeringDescription: string;
}

export default function BIPManager({ onBIPSave, currentBIP }: BIPManagerProps) {
  const [bip, setBip] = useState<BIPData>({
    logoFiles: [],
    toneOfVoiceMode: 'text',
    toneOfVoiceText: '',
    toneOfVoiceImages: [],
    preApprovedCreatives: [],
    targetAudience: '',
    offeringDescription: ''
  });

  const [saved, setSaved] = useState(false);

  const handleImageUpload = (field: keyof BIPData, files: FileList | null) => {
    if (!files) return;

    const newImages: ImageFile[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));

    setBip(prev => ({
      ...prev,
      [field]: [...(prev[field] as ImageFile[]), ...newImages]
    }));
  };

  const removeImage = (field: keyof BIPData, id: string) => {
    const images = bip[field] as ImageFile[];
    const image = images.find(img => img.id === id);
    if (image) {
      URL.revokeObjectURL(image.preview);
    }

    setBip(prev => ({
      ...prev,
      [field]: (prev[field] as ImageFile[]).filter((img: ImageFile) => img.id !== id)
    }));
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    if (!bip.logoFiles.length || !bip.targetAudience.trim()) {
      alert('Please upload at least one logo file and provide a target audience description.');
      return;
    }

    const logoBase64 = await Promise.all(
      bip.logoFiles.map(async img => ({
        name: img.name,
        data: await convertToBase64(img.file)
      }))
    );

    const toneOfVoiceImagesBase64 = await Promise.all(
      bip.toneOfVoiceImages.map(async img => ({
        name: img.name,
        data: await convertToBase64(img.file)
      }))
    );

    const preApprovedBase64 = await Promise.all(
      bip.preApprovedCreatives.map(async img => ({
        name: img.name,
        data: await convertToBase64(img.file)
      }))
    );

    const bipData = {
      logoFiles: logoBase64,
      toneOfVoiceMode: bip.toneOfVoiceMode,
      toneOfVoiceText: bip.toneOfVoiceText,
      toneOfVoiceImages: toneOfVoiceImagesBase64,
      preApprovedCreatives: preApprovedBase64,
      targetAudience: bip.targetAudience,
      offeringDescription: bip.offeringDescription
    };

    onBIPSave(JSON.stringify(bipData, null, 2));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const ImageUploadSection = ({
    title,
    field,
    required = false,
    description
  }: {
    title: string;
    field: keyof BIPData;
    required?: boolean;
    description: string;
  }) => {
    const images = bip[field] as ImageFile[];

    return (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            {title} {required && <span className="text-red-500">*</span>}
          </label>
          <p className="text-xs text-gray-600 mb-2">{description}</p>
        </div>

        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-4 pb-4">
            <Upload className="w-8 h-8 text-gray-400 mb-1" />
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Click to upload</span>
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF</p>
          </div>
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/*"
            onChange={(e) => handleImageUpload(field, e.target.files)}
          />
        </label>

        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.preview}
                  alt={img.name}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => removeImage(field, img.id)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="text-xs text-gray-600 mt-1 truncate">{img.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-semibold text-gray-800">
          Brand Profile
        </h2>
      </div>

      <div className="space-y-6">
        <ImageUploadSection
          title="Logo Files"
          field="logoFiles"
          required
          description="Upload your brand logo files - these are required for brand consistency evaluation"
        />

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Product/Service Description
            </label>
            <p className="text-xs text-gray-600 mb-2">
              Describe what you're offering - product features, service benefits, key differentiators
            </p>
          </div>
          <textarea
            value={bip.offeringDescription}
            onChange={(e) => setBip(prev => ({ ...prev, offeringDescription: e.target.value }))}
            placeholder="e.g., Premium eco-friendly yoga mats made from recycled materials, available in multiple colors and thickness options..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-32"
          />
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Tone of Voice Reference
            </label>
            <p className="text-xs text-gray-600 mb-2">
              Provide examples of your brand's communication style (optional)
            </p>
          </div>

          <div className="flex gap-4 mb-3">
            <button
              onClick={() => setBip(prev => ({ ...prev, toneOfVoiceMode: 'text' }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                bip.toneOfVoiceMode === 'text'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <Type className="w-4 h-4" />
              Text
            </button>
            <button
              onClick={() => setBip(prev => ({ ...prev, toneOfVoiceMode: 'images' }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                bip.toneOfVoiceMode === 'images'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Images with Copy
            </button>
          </div>

          {bip.toneOfVoiceMode === 'text' ? (
            <textarea
              value={bip.toneOfVoiceText}
              onChange={(e) => setBip(prev => ({ ...prev, toneOfVoiceText: e.target.value }))}
              placeholder="Describe your brand's tone of voice... e.g., Professional yet approachable, uses industry terminology, avoids jargon, friendly and conversational"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-32"
            />
          ) : (
            <ImageUploadSection
              title=""
              field="toneOfVoiceImages"
              description="Upload images of existing copy that exemplify your brand's tone of voice"
            />
          )}
        </div>

        <ImageUploadSection
          title="Pre-approved Creatives"
          field="preApprovedCreatives"
          description="Upload examples of creatives that have been approved and align with your brand standards (optional)"
        />

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Target Audience Description <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-600 mb-2">
              Describe who your brand is targeting - demographics, interests, pain points, behaviors
            </p>
          </div>
          <textarea
            value={bip.targetAudience}
            onChange={(e) => setBip(prev => ({ ...prev, targetAudience: e.target.value }))}
            placeholder="e.g., Health-conscious millennials aged 25-40, interested in sustainable living, active on social media, value quality over price..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-32"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={!bip.logoFiles.length || !bip.targetAudience.trim()}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Profile
        </button>

        {saved && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">BIP Saved Successfully</span>
          </div>
        )}

        {!saved && bip.logoFiles.length > 0 && bip.targetAudience.trim() && (
          <div className="text-sm text-gray-600">
            Ready to save - All required fields completed
          </div>
        )}
      </div>
    </div>
  );
}
