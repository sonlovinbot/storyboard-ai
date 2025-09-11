import React, { useState, useCallback } from 'react';

interface FileUploaderProps {
  onFileUpload: (content: string) => void;
  acceptedFileTypes: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, acceptedFileTypes }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onFileUpload(text);
      };
      if (file.type === 'text/plain') {
        reader.readAsText(file);
      } else {
        alert('File type not supported for direct reading. Only .txt is supported.');
        setFileName(null);
      }
    }
  }, [onFileUpload]);

  return (
    <div className="mt-2 flex justify-center rounded-lg border border-dashed border-brand-border px-6 py-10 hover:border-brand-primary transition-colors">
      <div className="text-center">
        <svg className="mx-auto h-12 w-12 text-gray-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
        </svg>
        <div className="mt-4 flex text-sm leading-6 text-brand-text-dark">
          <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-brand-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-primary focus-within:ring-offset-2 focus-within:ring-offset-brand-bg hover:text-brand-primary-hover">
            <span>Upload a file</span>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept={acceptedFileTypes} />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs leading-5 text-gray-500">.txt, .pdf, .docx (only .txt readable)</p>
        {fileName && <p className="text-sm mt-2 text-green-400">Uploaded: {fileName}</p>}
      </div>
    </div>
  );
};

export default FileUploader;
