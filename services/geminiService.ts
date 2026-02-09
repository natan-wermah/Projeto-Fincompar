
import { GoogleGenAI, Modality } from "@google/genai";
import { Transaction, Goal } from "../types";

// Always use named parameter and direct process.env.API_KEY access
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialSummary = async (transactions: Transaction[], goals: Goal[]) => {
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
