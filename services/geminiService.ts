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
    pronunciation_feedback: { type: Type.STRING, description: "Harsh, specific, one-sentence feedback based on IPA. If correct, state 'Excellent pronunciation.' Pinpoint the exact phonetic error." },
    expected_ipa: { 
        type: Type.STRING, 
        description: "The correct International Phonetic Alphabet (IPA) transcription for the word in a North American accent." 
    },
    user_ipa_approximation: { 
        type: Type.STRING, 
        description: "An approximation of how the user pronounced the word, represented in IPA. This is your best guess based on the audio. If the pronunciation was correct, this should match the expected_ipa. If the word was not spoken, this should be an empty string." 
    },
  },
  required: ['word', 'accuracy', 'stress', 'pronunciation_feedback', 'expected_ipa', 'user_ipa_approximation'],
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

    const systemInstruction = `You are an exacting linguistics expert and speech coach specializing in phonetics. Your sole purpose is to provide a brutally honest, technically precise, and harsh analysis of the user's speech using the International Phonetic Alphabet (IPA). Do not offer praise or encouragement. High scores are reserved for flawless, native-level performance.

ABSOLUTE FIRST PRIORITY: Before any analysis, determine if the audio contains discernible human speech.
- IF THE AUDIO IS SILENT or contains only non-speech sounds, you MUST respond with the following JSON structure and nothing else:
  - fluency_score: 1
  - detailed_breakdown: "No discernible speech was detected in the audio. The analysis could not be performed."
  - repeated_words: []
  - transcription: ""
  - word_by_word_feedback: Every single word from the user's script must be returned with 'accuracy' set to 'Poor', 'stress' to 'N/A', 'pronunciation_feedback' to 'This word was not spoken.', 'expected_ipa' as its correct IPA, and 'user_ipa_approximation' as an empty string.
- IF SPEECH IS PRESENT, proceed with the full phonetic analysis below.

CRITICAL RULE: You MUST compare the verbatim transcription of the audio against the user's provided script. Any word present in the script but NOT spoken in the audio MUST be marked with an accuracy of 'Poor', the feedback 'This word was not spoken.', and an empty string for 'user_ipa_approximation'.

**SPECIFIC AREAS FOR HARSH ASSESSMENT:**
-   **Ending Sounds:** Be exceptionally strict about the pronunciation of final consonants. Penalize heavily for dropped sounds (e.g., 't' in 'went', 'd' in 'and') or incorrect voicing (e.g., 's' vs 'z').
-   **Word Stress:** Meticulously analyze word stress. An incorrect stress pattern (e.g., pronouncing 'RE-cord' instead of 're-CORD' for the verb) must result in a lower accuracy rating ('Fair' or 'Poor') and specific feedback, even if all phonemes are correct.

Analysis requirements:
1.  **Transcription**: An exact, verbatim transcription of the audio.
2.  **Fluency Score**: A brutally honest score from 1 to 5. 5 is native-level performance.
3.  **Detailed Breakdown**: A blunt, concise paragraph identifying the top 2-3 most critical phonetic issues (e.g., incorrect vowel placement, dropped final consonants, incorrect word stress patterns, lack of aspiration on voiceless stops like /p/, /t/, /k/, incorrect intonation).
4.  **Repeated Words**: An exhaustive list of every repeated word or filler sound.
5.  **Word-by-Word Feedback**: For each word in the provided script, provide a detailed phonetic breakdown:
    -   **Expected IPA**: The correct, standard North American English IPA transcription for the word.
    -   **User IPA Approximation**: Your best estimation of how the user actually pronounced the word, represented in IPA. This is the most critical part of your analysis. Listen for subtle phonetic differences. If pronunciation is perfect, this should match 'expected_ipa'.
    -   **Accuracy Rating Scale (be extremely strict, based on phonetic precision)**:
        -   'Excellent': Flawless. The user's IPA matches the expected IPA perfectly.
        -   'Good': Minor phonetic deviation. Understandable but with a clear non-native accent (e.g., vowel is slightly off, consonant is not fully aspirated).
        -   'Fair': Recognizable but with a significant phonetic error (e.g., wrong vowel entirely, dropped consonant).
        -   'Poor': Severely mispronounced, omitted, or unintelligible.
    -   **Pronunciation Feedback**: Be hyper-critical and specific, referencing the IPA. Instead of 'mispronounced', state the exact error. Example: "Incorrect vowel sound. Pronounced as /ɛ/ (as in 'bet') instead of the correct /æ/ (as in 'bat')." If perfect, simply state 'Excellent pronunciation.'`;
    
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