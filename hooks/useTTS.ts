import { useState, useRef, useEffect, useCallback } from 'react';

export const useTTS = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [rate, setRate] = useState(0.9);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        const synth = window.speechSynthesis;
        const u = new SpeechSynthesisUtterance();
        
        // Find a good quality voice
        const voices = synth.getVoices();
        let selectedVoice = voices.find(voice => voice.name.includes('Google') && voice.lang.startsWith('en'));
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => voice.lang.startsWith('en') && voice.default);
        }
        if (selectedVoice) {
            u.voice = selectedVoice;
        }

        u.onstart = () => {
            setIsPlaying(true);
            setIsPaused(false);
        };
        u.onpause = () => {
            setIsPlaying(true);
            setIsPaused(true);
        };
        u.onresume = () => {
            setIsPlaying(true);
            setIsPaused(false);
        };
        u.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
        };
        utteranceRef.current = u;
        
        // Ensure voices are loaded
        if (synth.getVoices().length === 0) {
            synth.onvoiceschanged = () => {
                const voices = synth.getVoices();
                let selectedVoice = voices.find(voice => voice.name.includes('Google') && voice.lang.startsWith('en'));
                if (!selectedVoice) {
                    selectedVoice = voices.find(voice => voice.lang.startsWith('en') && voice.default);
                }
                if (selectedVoice) {
                    u.voice = selectedVoice;
                }
            };
        }

        return () => {
            synth.cancel();
        };
    }, []);

    const play = useCallback((text: string) => {
        if (!utteranceRef.current) return;
        const synth = window.speechSynthesis;
        if (synth.speaking) {
            synth.cancel();
        }
        utteranceRef.current.text = text;
        utteranceRef.current.rate = rate;
        synth.speak(utteranceRef.current);
    }, [rate]);

    const speak = useCallback((text: string) => {
        const synth = window.speechSynthesis;
        // Stop current full playback to prioritize word
        if (synth.speaking) {
            synth.cancel();
        }
        const wordUtterance = new SpeechSynthesisUtterance(text);
        if (utteranceRef.current?.voice) {
            wordUtterance.voice = utteranceRef.current.voice;
        }
        wordUtterance.rate = rate;
        synth.speak(wordUtterance);
    }, [rate]);

    const pause = useCallback(() => {
        window.speechSynthesis.pause();
    }, []);

    const resume = useCallback(() => {
        window.speechSynthesis.resume();
    }, []);
    
    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setIsPaused(false);
    }, []);

    const updateRate = useCallback((newRate: number) => {
        const clampedRate = Math.max(0.5, Math.min(2, newRate));
        setRate(clampedRate);
        if (utteranceRef.current) {
            utteranceRef.current.rate = clampedRate;
        }
        // If speaking, restart to apply new rate immediately
        if (window.speechSynthesis.speaking && !isPaused) {
            const currentText = utteranceRef.current?.text;
            if(currentText) {
                play(currentText);
            }
        }
    }, [isPaused, play]);


    return { isPlaying, isPaused, rate, play, pause, resume, stop, setRate: updateRate, speak };
};