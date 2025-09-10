import React, { useState, useMemo } from 'react';
import type { AnalysisReport, WordFeedback, ExampleSentence } from '../types.ts';
import { useTTS } from '../hooks/useTTS.ts';
import { PlayIcon } from './icons/PlayIcon.tsx';
import { PauseIcon } from './icons/PauseIcon.tsx';
import { StopIcon } from './icons/StopIcon.tsx';
import { SpeakerIcon } from './icons/SpeakerIcon.tsx';
import { SummaryModal } from './SummaryModal.tsx';

interface AnalysisResultProps {
  result: AnalysisReport;
  audioURL: string;
  script: string;
  onReset: () => void;
  onGenerateExamples: (words: string[]) => Promise<ExampleSentence[]>;
  googleSheetId: string;
  theme: 'light' | 'dark';
}

const getAccuracyClasses = (accuracy: WordFeedback['accuracy'], theme: 'light' | 'dark') => {
  if (theme === 'light') {
    switch (accuracy) {
      case 'Excellent': return 'bg-green-100 text-green-800 border-green-300';
      case 'Good':      return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Fair':      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Poor':      return 'bg-red-100 text-red-800 border-red-300';
      default:          return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  } else { // Dark theme
    switch (accuracy) {
      case 'Excellent': return 'bg-green-500/20 text-green-300 border-green-500/40';
      case 'Good':      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Fair':      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'Poor':      return 'bg-red-500/20 text-red-300 border-red-500/40';
      default:          return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
    }
  }
};

const FluencyStar: React.FC<{ filled: boolean }> = ({ filled }) => (
    <svg className={`w-6 h-6 ${filled ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, audioURL, script, onReset, onGenerateExamples, googleSheetId, theme }) => {
  const fullScript = result.word_by_word_feedback.map(w => w.word).join(' ');
  const { isPlaying, isPaused, rate, play, pause, resume, stop, setRate, speak: speakWord } = useTTS();
  const [showSummary, setShowSummary] = useState(false);
    
  const overallAccuracy = useMemo(() => {
    const scoreMap = { 'Excellent': 4, 'Good': 3, 'Fair': 2, 'Poor': 1 };
    const totalScore = result.word_by_word_feedback.reduce((acc, word) => acc + (scoreMap[word.accuracy] || 0), 0);
    const maxScore = result.word_by_word_feedback.length * 4;
    return maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(0) : 0;
  }, [result.word_by_word_feedback]);
  
  const challengingWords = useMemo(() => 
    result.word_by_word_feedback.filter(w => w.accuracy === 'Fair' || w.accuracy === 'Poor'),
    [result.word_by_word_feedback]
  );

  const handlePlayPause = () => (isPlaying ? (isPaused ? resume() : pause()) : play(fullScript));
  const changeRate = (delta: number) => setRate(rate + delta);

  const handleAddToSheet = () => {
    if (!googleSheetId) {
        alert("Please set your Google Sheet ID in the Settings panel first.");
        return;
    }
    alert(`Feature in Development\n\nGoogle Sheets integration requires server-side authentication and is not yet implemented in this frontend-only application.\n\nIf it were active, this would add your challenging words to the specified sheet.`);
  }

  return (
    <>
    {showSummary && (
        <SummaryModal 
            words={challengingWords}
            onGenerateExamples={onGenerateExamples}
            onClose={() => setShowSummary(false)} 
        />
    )}
    <div className="w-full max-w-5xl p-4 sm:p-6 bg-[var(--bg-secondary)] rounded-2xl shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center pb-4 border-b border-[var(--border-color)]">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3 sm:mb-0">Analysis Report</h2>
        <div className="flex items-center gap-6">
            <div className="text-center">
                <div className="flex justify-center">{[...Array(5)].map((_, i) => <FluencyStar key={i} filled={i < result.fluency_score} />)}</div>
                <div className="text-sm text-[var(--text-muted)] mt-1">Overall Fluency</div>
            </div>
            <div className="text-center">
                <div className="text-4xl font-bold text-indigo-400">{overallAccuracy}%</div>
                <div className="text-sm text-[var(--text-muted)]">Pronunciation Accuracy</div>
            </div>
        </div>
      </div>
      
      {/* Audio & Transcription */}
      <div className="space-y-4">
        <div>
            <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-2">Your Recording</h3>
            <audio controls src={audioURL} className="w-full" />
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-2">Target Text (Your Script)</h3>
                <p className="text-[var(--text-secondary)] bg-[var(--bg-tertiary)] p-3 rounded-lg h-full max-h-24 overflow-y-auto text-sm">"{script}"</p>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-2">As Recognized Speech</h3>
                <p className="text-[var(--text-secondary)] bg-[var(--bg-tertiary)] p-3 rounded-lg h-full max-h-24 overflow-y-auto text-sm italic">"{result.transcription}"</p>
            </div>
        </div>
      </div>

      {/* Breakdown & Speaker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-2 text-[var(--text-secondary)]">How to Improve</h3>
          <p className="text-[var(--text-secondary)] bg-[var(--bg-tertiary)] p-4 rounded-lg whitespace-pre-wrap">{result.detailed_breakdown}</p>
          {result.repeated_words.length > 0 && (
              <div className="mt-3">
                  <strong className="text-[var(--text-muted)]">Repeated Words:</strong>
                  <span className="text-yellow-400 ml-2">{result.repeated_words.join(', ')}</span>
              </div>
          )}
        </div>
        <div>
            <h3 className="text-xl font-semibold text-[var(--text-secondary)] mb-2">Natural Speaker Model</h3>
            <div className="flex items-center gap-2 p-2 bg-[var(--bg-tertiary)] rounded-lg">
                <button onClick={handlePlayPause} className="p-2 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] rounded-full text-white transition-colors">{isPlaying && !isPaused ? <PauseIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>}</button>
                <button onClick={stop} disabled={!isPlaying} className="p-2 bg-gray-600 hover:bg-gray-500 rounded-full text-white transition-colors disabled:opacity-50"><StopIcon className="w-5 h-5"/></button>
                <button onClick={() => changeRate(-0.25)} className="px-3 py-1 text-sm bg-[var(--bg-primary)] hover:opacity-80 rounded-md">Slower</button>
                <span className="text-sm font-mono w-10 text-center">{rate.toFixed(2)}x</span>
                <button onClick={() => changeRate(0.25)} className="px-3 py-1 text-sm bg-[var(--bg-primary)] hover:opacity-80 rounded-md">Faster</button>
            </div>
        </div>
      </div>

      {/* Word-by-Word Analysis */}
      <div>
        <h3 className="text-xl font-semibold mb-2 text-[var(--text-secondary)]">Word-by-Word Feedback</h3>
        <p className="text-[var(--text-muted)] mb-3 text-sm">Hover over a word for details. Click the speaker icon to hear its pronunciation.</p>
        <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg leading-loose text-lg flex flex-wrap gap-x-1 gap-y-3">
          {result.word_by_word_feedback.map((wordData, index) => (
            <div key={`${wordData.word}-${index}`} className="relative group flex items-center gap-1 cursor-pointer">
              <span className={`px-2 py-1 rounded-md border ${getAccuracyClasses(wordData.accuracy, theme)} transition-colors`}>{wordData.word}</span>
              <button onClick={() => speakWord(wordData.word)} className="text-[var(--text-muted)] hover:text-[var(--accent-color)] transition-colors opacity-0 group-hover:opacity-100"><SpeakerIcon className="w-5 h-5" /></button>

              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-gray-900 text-white border border-gray-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                <p><strong className="text-gray-400">Feedback:</strong> <span className="text-gray-300">{wordData.pronunciation_feedback}</span></p>
                <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 border-b border-r border-gray-700 transform rotate-45"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Action Buttons */}
       <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4 border-t border-[var(--border-color)]">
          {challengingWords.length > 0 && (
              <>
                <button
                  onClick={() => setShowSummary(true)}
                  className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg shadow-md transition-colors"
                >
                  Summarize Challenging Words ({challengingWords.length})
                </button>
                 <button
                  onClick={handleAddToSheet}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors"
                >
                  Add to Vocab Sheet
                </button>
              </>
          )}
        <button
          onClick={onReset}
          className="px-8 py-3 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-lg shadow-md transition-colors"
        >
          Analyze Another
        </button>
      </div>

    </div>
    </>
  );
};