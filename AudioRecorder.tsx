import React, { useState, useEffect, useCallback } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder.ts';
import { MicIcon } from './icons/MicIcon.tsx';
import { StopIcon } from './icons/StopIcon.tsx';

interface AudioRecorderProps {
  onRecordingComplete: (audioData: { data: string; mimeType: string }) => void;
  onCancel: () => void;
}

const MAX_DURATION_SECONDS = 300; // 5 minutes

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, onCancel }) => {
  const { status, error, startRecording, stopRecording } = useAudioRecorder();
  const [duration, setDuration] = useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const handleStart = useCallback(async () => {
    const res = await startRecording();
    if (res?.stopped) {
        res.stopped.then(({ blob, mimeType }) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                onRecordingComplete({ data: base64, mimeType });
            };
            reader.readAsDataURL(blob);
        });
    }
  }, [startRecording, onRecordingComplete]);

  const handleStop = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  useEffect(() => {
    if (status === 'recording') {
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= MAX_DURATION_SECONDS) {
            handleStop();
            return MAX_DURATION_SECONDS;
          }
          return newDuration;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status, handleStop]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md p-8 bg-[var(--bg-secondary)] rounded-2xl shadow-xl text-center flex flex-col items-center gap-6">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">
        {status === 'recording' ? 'Recording...' : 'Ready to Record'}
      </h2>
      <div className="relative w-40 h-40 flex items-center justify-center">
        {status === 'recording' && <div className="absolute inset-0 bg-red-500/30 rounded-full animate-pulse"></div>}
        <div className="relative w-32 h-32 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center">
            <span className="text-3xl font-mono text-[var(--text-primary)] tracking-widest">{formatTime(duration)}</span>
        </div>
      </div>
      <p className="text-sm text-[var(--text-muted)]">Max duration: {formatTime(MAX_DURATION_SECONDS)}</p>
      
      {error && <p className="text-red-400">{error}</p>}
      
      <div className="flex items-center gap-4">
        {status !== 'recording' ? (
          <button onClick={handleStart} className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-105">
            <MicIcon />
            Start Recording
          </button>
        ) : (
          <button onClick={handleStop} className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-105">
            <StopIcon />
            Stop Recording
          </button>
        )}
        <button onClick={onCancel} className="px-6 py-3 bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
};