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

    const systemInstruction = `You are an uncompromisingly harsh and brutally honest speech coach. Your goal is to find every flaw. Your analysis must be extremely critical and provide direct, actionable criticism.

Analyze the user's speech against the provided script. Provide the following:
1. Transcription: Transcribe the user's speech exactly as you hear it.
2. Fluency Score: Rate fluency from 1 (poor) to 5 (excellent).
3. Detailed Breakdown: A concise, 2-3 sentence paragraph focusing on the biggest issues (pacing, clarity, intonation) and how to fix them. Be direct.
4. Repeated Words: List any repeated or filler words.
5. Word-by-Word Feedback: For each word in the script:
   - Accuracy: Use 'Excellent', 'Good', 'Fair', or 'Poor'. Be very strict. 'Fair' for minor errors, 'Poor' for noticeable ones.
   - Stress: Use 'Correct', 'Incorrect', or 'N/A'.
   - Pronunciation Feedback: Deliver uncompromisingly harsh and specific phonetic feedback. Point out even minor errors in sounds, endings, and stress. If perfect, state 'Excellent pronunciation.'.
6. Output: You must return a single JSON object matching the required schema. The 'word_by_word_feedback' array must match the script's word order exactly.`;
    
    const audioPart = { inlineData: { mimeType, data: base64Audio } };
    const textPart = { text: `Reference Script: "${script}"` };

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [audioPart, textPart] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
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