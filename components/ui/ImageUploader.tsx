import React, { useCallback, useState } from 'react';

interface ImageUploaderProps {
  onImageUpload: (base64: string) => void;
  label: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, label }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onImageUpload(base64);
        setFileName(file.name);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid image file.');
    }
  }, [onImageUpload]);

  return (
    <div>
      <label className="block text-sm font-medium text-brand-text-dark">{label}</label>
      <div className="mt-1 flex items-center">
        <label htmlFor={`image-upload-${label}`} className="cursor-pointer bg-brand-secondary hover:bg-brand-border text-brand-text-light text-xs font-semibold py-1.5 px-2.5 rounded-md transition-colors">
          <span>{fileName ? 'Change Image' : 'Upload Image'}</span>
          <input id={`image-upload-${label}`} type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
        </label>
        {fileName && <span className="ml-3 text-sm text-brand-text-dark truncate">{fileName}</span>}
      </div>
    </div>
  );
};

export default ImageUploader;
