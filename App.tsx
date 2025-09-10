import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ScriptInput } from './components/ScriptInput';
import { AudioRecorder } from './components/AudioRecorder';
import { AudioUploader } from './components/AudioUploader';
import { AnalysisResult } from './components/AnalysisResult';
import { Loader } from './components/Loader';
import { ApiKeyInput } from './components/ApiKeyInput';
import { Settings } from './components/Settings';
import { MicIcon } from './components/icons/MicIcon';
import { UploadIcon } from './components/icons/UploadIcon';
import type { AnalysisReport, AppStatus, Theme } from './types';
import { analyzeSpeech, generateExampleSentences } from './services/geminiService';

const App: React.FC = () => {
  const [script, setScript] = useState<string>('');
  const [articleTitle, setArticleTitle] = useState('');
  const [articleLink, setArticleLink] = useState('');
  const [status, setStatus] = useState<AppStatus>('idle');
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('user-api-key'));
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
  const [googleSheetId, setGoogleSheetId] = useState<string>(() => localStorage.getItem('google-sheet-id') || '');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const handleSetApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('user-api-key', key);
    } else {
      localStorage.removeItem('user-api-key');
    }
  };

  const handleSetGoogleSheetId = (id: string) => {
    setGoogleSheetId(id);
    localStorage.setItem('google-sheet-id', id);
  }

  const handleAudioReady = useCallback(async (audioData: { data: string; mimeType: string }) => {
    if (!script.trim()) {
      setError('Please provide a script to analyze against.');
      setStatus('error');
      return;
    }
    if (!apiKey) {
      setError('Please enter your Google Gemini API key to proceed.');
      setStatus('error');
      return;
    }
    
    const dataUri = `data:${audioData.mimeType};base64,${audioData.data}`;
    setAudioURL(dataUri);

    setStatus('analyzing');
    setError(null);
    setAnalysis(null);

    try {
      const result = await analyzeSpeech(apiKey, audioData.data, audioData.mimeType, script);
      if (result && result.word_by_word_feedback && result.word_by_word_feedback.length > 0) {
        setAnalysis(result);
        setStatus('results');
      } else {
        throw new Error('Analysis returned an empty or invalid result. Please try again.');
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
      setError(`Analysis Failed: ${errorMessage}`);
      setStatus('error');
    }
  }, [script, apiKey]);

  const resetState = () => {
    setStatus('idle');
    setAnalysis(null);
    setError(null);
    setAudioURL(null);
  };
  
  const handleGenerateExamples = async (words: string[]) => {
      if (!apiKey) {
          throw new Error("API key is not set.");
      }
      return generateExampleSentences(apiKey, words);
  }

  const renderContent = () => {
    if (!apiKey) {
        return <ApiKeyInput onSetApiKey={handleSetApiKey} isInitialSetup={true} />;
    }
    
    if (showSettings) {
        return <Settings 
            currentTheme={theme}
            onSetTheme={setTheme}
            googleSheetId={googleSheetId}
            onSetGoogleSheetId={handleSetGoogleSheetId}
            apiKey={apiKey}
            onSetApiKey={handleSetApiKey}
            onClose={() => setShowSettings(false)}
        />
    }

    switch (status) {
      case 'analyzing':
        return <Loader />;
      case 'results':
        return analysis && audioURL && (
            <AnalysisResult 
                result={analysis} 
                audioURL={audioURL}
                script={script}
                onReset={resetState}
                onGenerateExamples={handleGenerateExamples}
                googleSheetId={googleSheetId}
                theme={theme}
            />
        );
      case 'error':
        return (
          <div className="text-center p-8 bg-[var(--bg-secondary)] rounded-lg shadow-lg">
            <h2 className="text-2xl text-red-500 mb-4">An Error Occurred</h2>
            <p className="text-[var(--text-secondary)] mb-6">{error}</p>
            <button
              onClick={resetState}
              className="px-6 py-2 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-lg shadow-md transition-colors duration-300"
            >
              Try Again
            </button>
          </div>
        );
      case 'recording':
        return <AudioRecorder onRecordingComplete={handleAudioReady} onCancel={() => setStatus('idle')} />;
      case 'uploading':
        return <AudioUploader onUploadComplete={handleAudioReady} onCancel={() => setStatus('idle')} />;
      case 'idle':
      default:
        return (
          <div className="w-full max-w-3xl mx-auto space-y-8">
            <div className="p-6 bg-[var(--bg-secondary)] rounded-lg shadow-md space-y-4">
                <h2 className="text-xl font-semibold text-center text-[var(--text-primary)]">Article Details (Optional)</h2>
                 <input
                    type="text"
                    placeholder="Article Title"
                    value={articleTitle}
                    onChange={(e) => setArticleTitle(e.target.value)}
                    className="w-full p-3 bg-[var(--bg-tertiary)] border-2 border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] transition-colors duration-300"
                />
                <input
                    type="text"
                    placeholder="Article Link (URL)"
                    value={articleLink}
                    onChange={(e) => setArticleLink(e.target.value)}
                    className="w-full p-3 bg-[var(--bg-tertiary)] border-2 border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] transition-colors duration-300"
                />
            </div>
            <ScriptInput value={script} onChange={setScript} />
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={() => setStatus('recording')}
                disabled={!script.trim()}
                className="flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed transform hover:scale-105"
              >
                <MicIcon />
                Record Audio
              </button>
              <button
                onClick={() => setStatus('uploading')}
                disabled={!script.trim()}
                className="flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-lg shadow-lg transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed transform hover:scale-105"
              >
                <UploadIcon />
                Upload MP3
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-8">
      <Header onSettingsClick={() => setShowSettings(true)} showSettingsButton={!!apiKey} />
      <main className="w-full flex-grow flex items-center justify-center">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;