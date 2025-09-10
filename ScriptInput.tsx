import React from 'react';

interface ScriptInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const ScriptInput: React.FC<ScriptInputProps> = ({ value, onChange }) => {
  return (
    <div className="w-full">
      <label htmlFor="script" className="block text-lg font-semibold text-[var(--text-secondary)] mb-3 text-center">
        1. Paste Your Script Here
      </label>
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