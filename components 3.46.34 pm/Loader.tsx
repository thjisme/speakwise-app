import React, { useState, useEffect } from 'react';

const messages = [
    "Analyzing your speech patterns...",
    "Evaluating pronunciation and stress...",
    "Calibrating accuracy scores...",
    "Generating word-by-word feedback...",
    "This may take a moment, great speaking takes time!",
];

export const Loader: React.FC = () => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-[var(--bg-secondary)] rounded-lg">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
      <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-6">Analyzing...</h2>
      <p className="text-[var(--text-secondary)] mt-2 transition-opacity duration-500">
        {messages[messageIndex]}
      </p>
    </div>
  );
};