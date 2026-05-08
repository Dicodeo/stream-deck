
import { GoogleGenAI, Modality } from "@google/genai";

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

export async function speakText(text: string, voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore') {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      playPcmAudio(base64Audio);
    }
  } catch (error) {
    console.error("Erro no Gemini TTS:", error);
  }
}

function playPcmAudio(base64Data: string, sampleRate: number = 24000) {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Int16Array(len / 2);
  
  for (let i = 0; i < len; i += 2) {
    // PCM is 16-bit little-endian
    const val = binaryString.charCodeAt(i) | (binaryString.charCodeAt(i + 1) << 8);
    // Convert to signed 16-bit
    bytes[i / 2] = val > 32767 ? val - 65536 : val;
  }

  const audioBuffer = audioContext.createBuffer(1, bytes.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  for (let i = 0; i < bytes.length; i++) {
    // Convert Int16 to Float32 [-1.0, 1.0]
    channelData[i] = bytes[i] / 32768.0;
  }

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
}
