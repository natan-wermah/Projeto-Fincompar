
import { GoogleGenAI, Modality } from "@google/genai";
import { Transaction, Goal } from "../types";

// Use Vite's import.meta.env for environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Only initialize if API key is available
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'PLACEHOLDER_API_KEY') {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error('Failed to initialize Google AI:', error);
  }
}

export const getFinancialSummary = async (transactions: Transaction[], goals: Goal[]) => {
  // Return default message if AI is not initialized
  if (!ai) {
    console.warn('Gemini API key not configured');
    return "Configure sua chave da API do Gemini para ver análises personalizadas!";
  }

  const prompt = `
    Analise os seguintes dados financeiros de um casal e forneça um resumo motivador e curto (máximo 150 palavras) em português.

    Transações Recentes: ${JSON.stringify(transactions.slice(0, 5))}
    Metas Atuais: ${JSON.stringify(goals)}

    Destaque a categoria com mais gastos e como eles estão indo em direção às metas.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Use .text property as per guidelines
    return response.text;
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Não foi possível gerar seu resumo inteligente no momento. Continue economizando!";
  }
};

export const generateAudioTip = async (text: string) => {
  // Return null if AI is not initialized
  if (!ai) {
    console.warn('Gemini API key not configured');
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Diga com um tom calmo e educativo: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    // Extracting audio data from the response candidates - raw PCM data
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
  } catch (error) {
    console.error("Error generating audio tip:", error);
    return null;
  }
};
