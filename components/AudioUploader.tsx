import React, { useState, useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon.tsx';

interface AudioUploaderProps {
  onUploadComplete: (audioData: { data: string; mimeType:string }) => void;
  onCancel: () => void;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const AudioUploader: React.FC<AudioUploaderProps> = ({ onUploadComplete, onCancel }) => {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.type !== 'audio/mpeg') {
      setError('Invalid file type. Please upload an MP3 file.');
      setFileName(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      setFileName(null);
      return;
    }
    
    setFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      onUploadComplete({ data: base64, mimeType: 'audio/mp3' });
    };
    reader.onerror = () => {
      setError('Failed to read the file.');
      setFileName(null);
    };
    reader.readAsDataURL(file);
  };
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-md p-8 bg-[var(--bg-secondary)] rounded-2xl shadow-xl text-center flex flex-col items-center gap-6">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">Upload MP3 File</h2>
      <p className="text-sm text-[var(--text-muted)]">Max file size: {MAX_FILE_SIZE_MB}MB (approx. 5-10 mins of audio)</p>
      
      <div className="w-full p-6 border-2 border-dashed border-[var(--border-color)] rounded-lg">
          <input
            type="file"
            accept=".mp3,audio/mpeg"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            onClick={handleButtonClick}
            className="flex flex-col items-center justify-center gap-3 w-full text-indigo-500 hover:text-indigo-600 transition-colors"
          >
            <UploadIcon className="w-10 h-10"/>
            <span className="font-semibold">{fileName ? 'Change File' : 'Choose a File'}</span>
          </button>
          {fileName && <p className="text-[var(--text-secondary)] mt-4 break-all">{fileName}</p>}
      </div>
      
      {error && <p className="text-red-400">{error}</p>}

      <button onClick={onCancel} className="mt-4 px-6 py-3 bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
        Cancel
      </button>
    </div>
  );
};