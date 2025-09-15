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
    const [copyWordsButtonText, setCopyWordsButtonText] = useState('Export words only');
    const [copyDetailsButtonText, setCopyDetailsButtonText] = useState('Export words with part of speech and example sentences');

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

    const handleExportWordsOnly = () => {
        // Use a map to handle case-insensitivity while preserving the first-seen case.
        // This handles "EVen" vs "even" by keeping the first one encountered in the list.
        const uniqueWords = new Map<string, string>();
        words.forEach(wordData => {
            const lower = wordData.word.toLowerCase();
            if (!uniqueWords.has(lower)) {
                uniqueWords.set(lower, wordData.word);
            }
        });

        const wordsToExport = Array.from(uniqueWords.values()).join('\n');
        
        navigator.clipboard.writeText(wordsToExport).then(() => {
            setCopyWordsButtonText('Copied!');
            setTimeout(() => setCopyWordsButtonText('Export words only'), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            setCopyWordsButtonText('Error!');
            setTimeout(() => setCopyWordsButtonText('Export words only'), 2000);
        });
    };
    
    const handleExportWithDetails = () => {
        const header = "Word\tPart of Speech\tExample Sentence";
        const rows = examples.map(ex => {
            // Sanitize sentence for TSV format: escape quotes, remove newlines and tabs
            const cleanSentence = ex.sentence.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\t/g, ' ');
            return [ex.word, ex.part_of_speech, `"${cleanSentence}"`].join('\t');
        });

        const tsvContent = [header, ...rows].join('\n');
        
        navigator.clipboard.writeText(tsvContent).then(() => {
            setCopyDetailsButtonText('Copied!');
            setTimeout(() => setCopyDetailsButtonText('Export words with part of speech and example sentences'), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            setCopyDetailsButtonText('Error!');
            setTimeout(() => setCopyDetailsButtonText('Export words with part of speech and example sentences'), 2000);
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
                            {examples.map(({ word, sentence, part_of_speech }) => (
                                <li key={word} className="p-4 bg-[var(--bg-tertiary)] rounded-md">
                                    <h3 className="text-xl font-semibold text-[var(--accent-color)] flex items-center gap-3">
                                        {word}
                                        <span className="text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-primary)] px-2 py-1 rounded-full">{part_of_speech}</span>
                                    </h3>
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
                    <div className="pt-4 mt-4 border-t border-[var(--border-color)] flex flex-col gap-2">
                        <button
                            onClick={handleExportWordsOnly}
                            className="w-full px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors"
                        >
                            {copyWordsButtonText}
                        </button>
                         <button
                            onClick={handleExportWithDetails}
                            className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors"
                        >
                            {copyDetailsButtonText}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};