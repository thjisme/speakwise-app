import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisReport, ExampleSentence } from '../types.ts';

// This function creates a new instance of the AI client with the provided key.
// It's called by each service function to ensure the user's key is used.
const getAIClient = (apiKey: string) => {
  if (!apiKey) {
    throw new Error("API_KEY has not been provided.");
  }
  return new GoogleGenAI({ apiKey });
};

const wordFeedbackSchema = {
  type: Type.OBJECT,
  properties: {
    word: { type: Type.STRING, description: "The word from the script." },
    accuracy: { type: Type.STRING, description: "Rated: 'Excellent', 'Good', 'Fair', or 'Poor'." },
    stress: { type: Type.STRING, description: "Rated: 'Correct', 'Incorrect', or 'N/A'." },
    pronunciation_feedback: { type: Type.STRING, description: "Harsh, specific, one-sentence feedback. If correct, state 'Excellent pronunciation.'" },
  },
  required: ['word', 'accuracy', 'stress', 'pronunciation_feedback'],
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        transcription: {
            type: Type.STRING,
            description: "A full, accurate transcription of the speech heard in the audio."
        },
        fluency_score: {
            type: Type.INTEGER,
            description: "Overall fluency score from 1 (poor) to 5 (excellent)."
        },
        detailed_breakdown: {
            type: Type.STRING,
            description: "A concise, actionable paragraph (2-3 sentences) on what the user did wrong (pacing, intonation, clarity) and how to improve. Be direct and critical."
        },
        repeated_words: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of repeated or filler words."
        },
        word_by_word_feedback: {
            type: Type.ARRAY,
            items: wordFeedbackSchema,
            description: "Array of word-by-word analysis. Must match the script's word order."
        }
    },
    required: ['transcription', 'fluency_score', 'detailed_breakdown', 'repeated_words', 'word_by_word_feedback']
};

export const analyzeSpeech = async (apiKey: string, base64Audio: string, mimeType: string, script: string): Promise<AnalysisReport | null> => {
  try {
    const ai = getAIClient(apiKey);
    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are an exacting linguistics expert and speech coach. Your sole purpose is to provide a brutally honest, technically precise, and harsh analysis of the user's speech. Do not offer praise or encouragement. High scores are exceptionally rare and reserved for flawless, native-level performance.

CRITICAL RULE: You MUST compare the verbatim transcription of the audio against the user's provided script. Any word present in the script but NOT spoken in the audio MUST be marked with an accuracy of 'Poor' and the feedback 'This word was not spoken.' There are no exceptions to this rule.

Analysis requirements:
1.  **Transcription**: An exact, verbatim transcription of the audio.
2.  **Fluency Score**: A brutally honest score from 1 to 5. 5/5 is a flawless, native-level performance. 4/5 is near-perfect with very minor, almost unnoticeable issues. 3/5 is clear but with noticeable non-native pacing or hesitation. 2/5 is difficult to understand. 1/5 is nearly incomprehensible.
3.  **Detailed Breakdown**: A blunt, concise paragraph identifying the top 2-3 most critical issues (e.g., poor sibilance, dropped final consonants, incorrect intonation patterns) and what to do to fix them.
4.  **Repeated Words**: An exhaustive list of every repeated word or filler sound ('uh', 'um').
5.  **Word-by-Word Feedback**: For each word in the provided script:
    -   **Accuracy Rating Scale (be extremely strict)**:
        -   'Excellent': Flawless, perfect, native-level North American standard pronunciation and stress. No exceptions.
        -   'Good': The word is correct and understandable but possesses a clear non-native accent, intonation, or slight phonetic inaccuracy.
        -   'Fair': The word is mispronounced but still recognizable. This includes incorrect vowel sounds, improper stress, or soft/unclear consonants.
        -   'Poor': The word is severely mispronounced, omitted entirely, or unintelligible. This is the default for any significant error, especially dropped ending sounds (e.g., pronouncing 'walked' as 'walk').
    -   **Pronunciation Feedback**: Be hyper-critical and specific. Instead of 'mispronounced', say 'Incorrect vowel sound, pronounced as /ɪ/ (as in 'sit') instead of /iː/ (as in 'seat').' Mention dropped final consonants (e.g., 'Final '-t' sound was dropped'). If perfect, simply state 'Excellent pronunciation.'`;
    
    const audioPart = { inlineData: { mimeType, data: base64Audio } };
    const textPart = { text: `Reference Script: "${script}"` };

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [audioPart, textPart] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        seed: 42,
      },
    });

    const jsonString = response.text.trim();
    if (!jsonString) {
        throw new Error("API returned an empty response.");
    }
    const parsedResult = JSON.parse(jsonString);
    if (!parsedResult.word_by_word_feedback || parsedResult.word_by_word_feedback.length === 0) {
      throw new Error("Analysis is missing word-by-word feedback.");
    }

    return parsedResult as AnalysisReport;

  } catch (error) {
    console.error("Error calling Gemini API for speech analysis:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error("Failed to parse the analysis from the AI. The response was not valid JSON.");
    }
    throw error;
  }
};

const exampleSentenceSchema = {
    type: Type.OBJECT,
    properties: {
        word: { type: Type.STRING },
        sentence: { type: Type.STRING, description: "A simple, clear sentence using the word."}
    },
    required: ['word', 'sentence']
};

export const generateExampleSentences = async (apiKey: string, words: string[]): Promise<ExampleSentence[]> => {
    try {
        const ai = getAIClient(apiKey);
        const model = 'gemini-2.5-flash';
        const prompt = `For each word in the following list, create a simple and clear example sentence that demonstrates its common usage. Words: ${words.join(', ')}`;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        examples: {
                            type: Type.ARRAY,
                            items: exampleSentenceSchema
                        }
                    }
                }
            }
        });
        
        const jsonString = response.text.trim();
        const parsedResult = JSON.parse(jsonString);

        if (!parsedResult.examples || parsedResult.examples.length === 0) {
            throw new Error("Could not generate example sentences.");
        }

        return parsedResult.examples as ExampleSentence[];

    } catch (error) {
        console.error("Error calling Gemini API for sentence generation:", error);
        throw new Error("Failed to generate example sentences.");
    }
}