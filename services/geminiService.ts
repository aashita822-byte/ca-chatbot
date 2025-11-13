
import { GoogleGenAI, Type } from '@google/genai';
import { ChatStyle, DiscussionResponse } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `You are an expert AI tutor for Chartered Accountancy (CA) students in India, acting as a helpful chatbot named 'CA-Bot'. You have access to a vast knowledge base of CA study materials, including PDFs stored in a vector database for RAG. Your answers must be accurate, detailed, and relevant to the Indian CA curriculum. Be professional, clear, and encouraging.`;

/**
 * Checks if a user's query is related to Chartered Accountancy.
 * Acts as a gatekeeper to keep the conversation on topic.
 * @param prompt The user's input text.
 * @returns A boolean indicating if the query is relevant.
 */
export const isCaRelatedQuery = async (prompt: string): Promise<boolean> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Use a fast model for classification
      contents: `Is the following user query related to the field of Chartered Accountancy (CA) in India, including topics like accounting, auditing, taxation, corporate law, finance, or CA exams? Respond in JSON format with a single key "is_related" which is a boolean. Query: "${prompt}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            is_related: {
              type: Type.BOOLEAN,
              description: 'True if the query is related to Chartered Accountancy, false otherwise.',
            },
          },
          required: ['is_related'],
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result.is_related;

  } catch (error) {
    console.error('Gemini API Error during query classification:', error);
    // Fail-safe: If classification fails, assume the query is related to avoid blocking the user.
    return true; 
  }
};


export const generateChatResponse = async (
  prompt: string,
  style: ChatStyle
): Promise<string | DiscussionResponse> => {
  try {
    if (style === 'discussion') {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a constructive debate between two personas, 'User A' and 'User B', on the following topic for a CA student: "${prompt}". Explore different facets of the topic, presenting clear, opposing, or complementary viewpoints. Ensure the discussion is balanced and insightful.`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              discussion: {
                type: Type.ARRAY,
                description: 'An array of discussion points.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: {
                      type: Type.STRING,
                      description: "The speaker, either 'User A' or 'User B'.",
                    },
                    text: {
                      type: Type.STRING,
                      description: 'The content of the speaker\'s argument.',
                    },
                  },
                  required: ['speaker', 'text'],
                },
              },
            },
            required: ['discussion'],
          },
        },
      });
      
      const jsonText = response.text.trim();
      return JSON.parse(jsonText) as DiscussionResponse;

    } else { // 'qa' style
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `As a CA student's AI tutor, answer the following question clearly and concisely: "${prompt}"`,
        config: {
          systemInstruction,
        },
      });
      return response.text;
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to get a response from the AI.');
  }
};