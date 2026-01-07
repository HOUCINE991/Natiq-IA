import React, { useState } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Language, VoiceSettings } from '../types';
import { base64ToUint8Array } from '../utils/audioUtils';
import { translations } from '../utils/translations';
import AudioPlayer from './AudioPlayer';

interface TTSGeneratorProps {
  settings: VoiceSettings;
  language: Language;
}

const TTSGenerator: React.FC<TTSGeneratorProps> = ({ settings, language }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = translations[language];

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        You are a professional voice actor.
        Read the following text.
        
        Style Requirements:
        - Country: ${settings.country}
        - Dialect/Accent: ${settings.dialect}
        - Tone: ${settings.tone}
        - Gender: ${settings.gender}
        - Voice Persona: ${settings.voiceName}
        
        Text to read:
        "${text}"
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: settings.voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (base64Audio) {
        // Convert to blob for playback
        const audioBytes = base64ToUint8Array(base64Audio);
        const wavBlob = createWavBlob(new Int16Array(audioBytes.buffer), 24000);
        const url = URL.createObjectURL(wavBlob);
        setAudioUrl(url);
      } else {
        throw new Error("No audio data received");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate audio");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `natiq-generated-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Helper to create a WAV file from PCM data
  const createWavBlob = (samples: Int16Array, sampleRate: number) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    const length = samples.length;
    let offset = 44;
    for (let i = 0; i < length; i++) {
      view.setInt16(offset, samples[i], true);
      offset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
  };

  return (
    <div className="bg-slate-800 p-5 rounded-2xl shadow-xl border border-slate-700">
      <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        {t.ttsTab}
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">{t.inputLabel}</label>
        <textarea
          className="w-full h-44 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-arabic text-base resize-none shadow-inner leading-relaxed"
          placeholder={t.inputPlaceholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          dir="auto"
        />
      </div>

      <div className="flex flex-col gap-4">
         {error && (
            <div className="text-red-400 text-sm bg-red-900/20 px-4 py-3 rounded-xl flex items-center gap-2 border border-red-500/20">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
            </div>
         )}
         
         {!audioUrl && (
            <div className="flex">
                <button
                onClick={handleGenerate}
                disabled={isLoading || !text}
                className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all transform active:scale-[0.98] shadow-lg touch-manipulation ${
                    isLoading || !text
                    ? 'bg-slate-600 cursor-not-allowed opacity-70'
                    : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/25'
                }`}
                >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t.processing}
                    </span>
                ) : (
                    t.generateBtn
                )}
                </button>
            </div>
         )}
      </div>

      {audioUrl && (
          <AudioPlayer 
            audioUrl={audioUrl} 
            onDownload={handleDownload}
            onRegenerate={handleGenerate}
            language={language}
            t={t}
          />
      )}
    </div>
  );
};

export default TTSGenerator;