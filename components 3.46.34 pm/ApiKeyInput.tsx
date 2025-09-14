import React, { useState } from 'react';

interface ApiKeyInputProps {
  onSetApiKey: (key: string) => void;
  isInitialSetup?: boolean;
  currentKey?: string;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onSetApiKey, isInitialSetup = false, currentKey = '' }) => {
  const [key, setKey] = useState(currentKey);

  const handleSave = () => {
    onSetApiKey(key);
  };

  const containerClasses = isInitialSetup 
    ? "w-full max-w-lg mx-auto text-center p-8 bg-[var(--bg-secondary)] rounded-lg shadow-xl"
    : "space-y-2";

  const titleClasses = isInitialSetup 
    ? "text-2xl font-bold text-[var(--text-primary)] mb-4"
    : "text-lg font-semibold text-[var(--text-primary)]";
    
  const descriptionClasses = isInitialSetup 
    ? "text-[var(--text-muted)] mb-6"
    : "text-sm text-[var(--text-muted)]";

  return (
    <div className={containerClasses}>
      <h2 className={titleClasses}>Enter Your API Key</h2>
      <p className={descriptionClasses}>
        You need a Google Gemini API key to use this application. Your key is saved only in your browser.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Enter your Google Gemini API key"
          className="flex-grow p-3 bg-[var(--bg-tertiary)] border-2 border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] transition-colors duration-300"
        />
        <button
          onClick={handleSave}
          disabled={!key.trim()}
          className="px-6 py-3 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-lg shadow-md transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isInitialSetup ? 'Start Analyzing' : 'Save Key'}
        </button>
      </div>
    </div>
  );
};
