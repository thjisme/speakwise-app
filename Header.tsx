import React from 'react';
import { SettingsIcon } from './icons/SettingsIcon.tsx';

interface HeaderProps {
  onSettingsClick: () => void;
  showSettingsButton: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick, showSettingsButton }) => {
  return (
    <header className="w-full max-w-5xl mx-auto text-center mb-8 md:mb-12 relative">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600 mb-2">
        SpeakWise
      </h1>
      <p className="text-lg sm:text-xl text-[var(--text-muted)]">
        Your Personal Speaking Coach
      </p>
      {showSettingsButton && (
        <button 
          onClick={onSettingsClick} 
          className="absolute top-0 right-0 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Open settings"
        >
          <SettingsIcon className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      )}
    </header>
  );
};