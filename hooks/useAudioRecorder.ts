
import { useState, useRef, useCallback } from 'react';

export type RecordingStatus = 'inactive' | 'recording' | 'paused' | 'stopped';

export const useAudioRecorder = () => {
  const [status, setStatus] = useState<RecordingStatus>('inactive');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    setStatus('inactive');
    setError(null);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setStatus('recording');
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstart = () => {
        setStatus('recording');
      };
      
      const stopped = new Promise<{ blob: Blob; mimeType: string }>((resolve, reject) => {
        mediaRecorderRef.current!.onstop = () => {
          const mimeType = mediaRecorderRef.current!.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          audioChunksRef.current = [];
          setStatus('stopped');
          // Stop all tracks on the stream
          stream.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          resolve({ blob: audioBlob, mimeType });
        };
        mediaRecorderRef.current!.onerror = (event) => {
            const mediaRecorderError = (event as any).error || new Error("MediaRecorder error");
            console.error("MediaRecorder error:", mediaRecorderError);
            setError(`Recording error: ${mediaRecorderError.name}`);
            reject(mediaRecorderError);
        };
      });

      mediaRecorderRef.current.start();
      return { stopped };

    } catch (err) {
      console.error("Error accessing microphone:", err);
      const errorMessage = err instanceof Error ? err.message : "Could not access microphone.";
      if(errorMessage.includes('Permission denied')) {
        setError("Microphone permission denied. Please allow microphone access in your browser settings.");
      } else {
        setError(errorMessage);
      }
      setStatus('inactive');
      return { stopped: Promise.reject(err) };
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [status]);
  
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = null; // Prevent onstop from firing
        if (mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    audioChunksRef.current = [];
    setStatus('inactive');
  }, []);

  return { status, error, startRecording, stopRecording, cancelRecording };
};