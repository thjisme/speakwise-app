import React, { useState, useEffect } from 'react';
import type { WordFeedback, ExampleSentence } from '../types.ts';
import { CloseIcon } from './icons/CloseIcon.tsx';

interface SummaryModalProps {
    words: WordFeedback[];
    onGenerateExamples: (words: string[]) => Promise<ExampleSentence[]>;
    onClose: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({ words, onGenerateExamples, onClose }) => {
    const [examples, setExamples] = useState<ExampleSentence[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copyButtonText, setCopyButtonText] = useState('Export for Sheets');

    useEffect(() => {
        const fetchExamples = async () => {
            if (words.length === 0) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setError(null);
                const wordStrings = words.map(w => w.word);
                const result = await onGenerateExamples(wordStrings);
                setExamples(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load examples.");
            } finally {
                setLoading(false);
            }
        };
        fetchExamples();
    }, [words, onGenerateExamples]);

    const getWordFeedback = (word: string) => {
        return words.find(w => w.word.toLowerCase() === word.toLowerCase())?.pronunciation_feedback;
    }

    const handleExport = () => {
        const wordsToExport = words.map(w => w.word).join('\n');
        navigator.clipboard.writeText(wordsToExport).then(() => {
            setCopyButtonText('Copied!');
            setTimeout(() => setCopyButtonText('Export for Sheets'), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            setCopyButtonText('Error!');
            setTimeout(() => setCopyButtonText('Export for Sheets'), 2000);
        });
    };

    return (
        <div className="print-hide fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="w-full max-w-2xl bg-[var(--bg-secondary)] rounded-lg shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center pb-4 border-b border-[var(--border-color)]">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Challenging Words Summary</h2>
                    <button onClick={onClose} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                        <CloseIcon />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto mt-4 pr-2 space-y-4">
                    {loading && <p className="text-center text-[var(--text-secondary)]">Generating example sentences...</p>}
                    {error && <p className="text-center text-red-500">{error}</p>}
                    {!loading && !error && (
                        <ul className="space-y-4">
                            {examples.map(({ word, sentence }) => (
                                <li key={word} className="p-4 bg-[var(--bg-tertiary)] rounded-md">
                                    <h3 className="text-xl font-semibold text-[var(--accent-color)]">{word}</h3>
                                    <p className="text-[var(--text-secondary)] italic my-1">"{sentence}"</p>
                                    <p className="text-sm text-[var(--text-muted)] mt-2">
                                        <strong >Feedback:</strong> {getWordFeedback(word)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                 {words.length > 0 && !loading && !error && (
                    <div className="pt-4 mt-4 border-t border-[var(--border-color)]">
                        <button
                            onClick={handleExport}
                            className="w-full px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors"
                        >
                            {copyButtonText}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};