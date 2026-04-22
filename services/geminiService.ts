import { GoogleGenAI, Type } from "@google/genai";
import { JsonUIConfig } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// System instruction to teach Gemini the JsonUI schema
const SYSTEM_INSTRUCTION = `
You are an expert AI assistant for "JsonUI", an embedded UI framework. 
Your job is to generate valid JSON configurations based on user prompts or image inputs.

The JSON structure must strictly follow this TypeScript interface:

interface Widget {
  id: string;
  type: 'container' | 'button' | 'label' | 'image' | 'slider' | 'chart';
  style: {
    x: number; y: number; width: number; height: number;
    backgroundColor?: string; textColor?: string; fontSize?: number; borderRadius?: number;
  };
  properties: {
    text?: string;
    binding?: string;
    value?: number;
  };
  children?: Widget[];
}

interface JsonUIConfig {
  screens: Array<{
    id: string;
    name: string;
    width: number;
    height: number;
    root: Widget;
  }>;
}

Rules:
1. Always return valid JSON.
2. Root widget is usually a container filling the screen.
3. Use hex codes for colors.
4. Assume a screen resolution of 800x480 unless specified.
5. Create realistic, modern embedded UI designs (automotive, industrial, medical, consumer electronics).
`;

export const generateUiFromText = async (prompt: string): Promise<JsonUIConfig | null> => {
  if (!apiKey) {
    console.error("API Key missing");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        // We use a loose schema definition to ensure valid JSON structure but allow flexibility
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            screens: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  width: { type: Type.NUMBER },
                  height: { type: Type.NUMBER },
                  root: { type: Type.OBJECT, description: "Recursive widget structure" }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as JsonUIConfig;
  } catch (e) {
    console.error("Gemini Text Gen Error:", e);
    throw e;
  }
};

export const generateUiFromImage = async (base64Image: string, prompt: string = "Convert this design to JsonUI config"): Promise<JsonUIConfig | null> => {
  if (!apiKey) {
    console.error("API Key missing");
    return null;
  }

  try {
    // Using flash-image for vision tasks
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // responseMimeType: "application/json" is not supported on flash-image yet, 
        // so we instruct via system prompt and try to parse the code block.
      }
    });

    const text = response.text;
    if (!text) return null;

    // Helper to extract JSON from markdown code block if present
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    const cleanJson = jsonMatch ? jsonMatch[1] : text;

    return JSON.parse(cleanJson) as JsonUIConfig;
  } catch (e) {
    console.error("Gemini Vision Error:", e);
    throw e;
  }
};
