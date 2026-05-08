
import { GoogleGenAI } from "@google/genai";

export async function runAIMacro(prompt: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Sem resposta da IA.";
  } catch (error) {
    console.error("Erro no Gemini:", error);
    return "Erro ao executar macro de IA.";
  }
}
