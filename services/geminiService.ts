import { GoogleGenAI, Type } from "@google/genai";

export const analyzeImage = async (base64Image: string): Promise<{ title: string; description: string; tags: string[] }> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found. Returning placeholder data.");
    return {
      title: "Untitled Photograph",
      description: "A beautiful capture.",
      tags: ["photography", "art"]
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Remove data:image/jpeg;base64, prefix if present for the API call (sometimes needed depending on version, but safe to handle)
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data
            }
          },
          {
            text: "Analyze this photograph for a professional portfolio. Provide a short, artistic title, a brief 1-sentence evocative description, and 3-5 relevant styling tags."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Artistic title of the photo" },
            description: { type: Type.STRING, description: "Brief, evocative description" },
            tags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3-5 visual tags"
            }
          },
          required: ["title", "description", "tags"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      title: "Untitled Capture",
      description: "Added without analysis due to connection error.",
      tags: ["photo"]
    };
  }
};