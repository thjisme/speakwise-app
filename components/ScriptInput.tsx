import React from 'react';

interface ScriptInputProps {
  value: string;
  onChange: (value: string) => void;
  onClearAll: () => void;
}

export const ScriptInput: React.FC<ScriptInputProps> = ({ value, onChange, onClearAll }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <label htmlFor="script" className="text-lg font-semibold text-[var(--text-secondary)]">
          1. Paste Your Script Here
        </label>
        <button 
          onClick={onClearAll}
          className="px-3 py-1 text-sm bg-transparent border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] rounded-md transition-colors"
        >
            Clear All
        </button>
      </div>
      <textarea
        id="script"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter the text you want to practice reading aloud..."
        className="w-full h-48 p-4 bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] transition-colors duration-300 resize-none"
      />
       <p className="text-center text-sm text-[var(--text-muted)] mt-2">
        You must provide a script before you can record or upload audio.
      </p>
    </div>
  );
};