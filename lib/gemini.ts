
import { GoogleGenAI, Type } from "@google/genai";

// В Expo переменные окружения должны начинаться с EXPO_PUBLIC_
const ai = new GoogleGenAI({ apiKey: process.env.EXPO_PUBLIC_API_KEY || '' });

export interface SearchIntent {
  category?: string;
  city?: string;
  maxPrice?: number;
  intent: 'search_specialist' | 'search_venue' | 'general_question';
  query_tags: string[];
}

export const analyzeSearchIntent = async (userInput: string): Promise<SearchIntent> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this user request for a service app: "${userInput}". 
    Extract the category of service, city, and maximum price if mentioned. 
    Identify if they are looking for a specialist or a venue. 
    Provide search tags in Russian.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          city: { type: Type.STRING },
          maxPrice: { type: Type.NUMBER },
          intent: { 
            type: Type.STRING, 
            description: "search_specialist, search_venue, or general_question" 
          },
          query_tags: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          }
        },
        required: ["intent", "query_tags"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { intent: 'general_question', query_tags: [userInput] };
  }
};

export const getAIReviewSummary = async (reviews: any[]): Promise<string> => {
  if (!reviews.length) return "Отзывов пока нет.";
  
  const text = reviews.map(r => `[${r.rating}*] ${r.comment}`).join('\n');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Сделай очень короткое резюме (1 предложение) на основе отзывов о мастере:\n${text}`,
  });
  
  return response.text || "Нет данных для анализа.";
};
