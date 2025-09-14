export interface WordFeedback {
  word: string;
  accuracy: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  stress: 'Correct' | 'Incorrect' | 'N/A';
  pronunciation_feedback: string;
  expected_ipa?: string;
  user_ipa_approximation?: string;
}

export interface AnalysisReport {
  fluency_score: number; // Score from 1 to 5
  detailed_breakdown: string; // The long paragraph of feedback
  repeated_words: string[]; // List of words repeated too often
  word_by_word_feedback: WordFeedback[];
  transcription: string; // The speech-to-text transcription of the user's audio
}

export interface ExampleSentence {
    word: string;
    sentence: string;
}

export type AppStatus = 'idle' | 'recording' | 'uploading' | 'analyzing' | 'results' | 'error';

export type Theme = 'light' | 'dark';