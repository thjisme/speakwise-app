import React from 'react';
import type { Theme } from '../types.ts';
import { ApiKeyInput } from './ApiKeyInput.tsx';
import { CloseIcon } from './icons/CloseIcon.tsx';

interface SettingsProps {
  currentTheme: Theme;
  onSetTheme: (theme: Theme) => void;
  apiKey: string;
  onSetApiKey: (key: string) => void;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ currentTheme, onSetTheme, apiKey, onSetApiKey, onClose }) => {
  return (
    <div className="w-full max-w-2xl p-6 sm:p-8 bg-[var(--bg-secondary)] rounded-2xl shadow-xl relative animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-[var(--text-primary)]">Settings</h2>
        <button onClick={onClose} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" aria-label="Close settings">
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      {/* API Key Settings */}
      <div className="border-t border-[var(--border-color)] pt-6">
          <ApiKeyInput onSetApiKey={onSetApiKey} currentKey={apiKey} />
      </div>

      {/* Theme Settings */}
      <div className="border-t border-[var(--border-color)] pt-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Theme</h3>
        <div className="flex items-center gap-4">
          <button onClick={() => onSetTheme('light')} className={`px-4 py-2 rounded-md ${currentTheme === 'light' ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--bg-tertiary)]'}`}>
            Light
          </button>
          <button onClick={() => onSetTheme('dark')} className={`px-4 py-2 rounded-md ${currentTheme === 'dark' ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--bg-tertiary)]'}`}>
            Dark
          </button>
        </div>
      </div>
    </div>
  );
};