import React, { useState, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { VoiceSettings, Language, Country } from '../types';
import { decodeAudioData, createPcmBlob, base64ToUint8Array } from '../utils/audioUtils';
import { translations } from '../utils/translations';
import AudioVisualizer from './AudioVisualizer';

interface LiveConversationProps {
  settings: VoiceSettings;
  language: Language;
}

const LiveConversation: React.FC<LiveConversationProps> = ({ settings, language }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = translations[language];

  // Audio Contexts & Nodes
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputGainRef = useRef<GainNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  
  // Session & Processing
  const sessionRef = useRef<any>(null); // To hold the live session
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const cleanup = () => {
    // Stop all sources
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();

    // Close tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Disconnect nodes
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Close contexts
    if (inputAudioContextRef.current?.state !== 'closed') {
      inputAudioContextRef.current?.close();
    }
    if (outputAudioContextRef.current?.state !== 'closed') {
        outputAudioContextRef.current?.close();
    }

    setIsConnected(false);
    nextStartTimeRef.current = 0;
  };

  const connect = async () => {
    setError(null);
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      // Initialize Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const inputCtx = inputAudioContextRef.current;
      const outputCtx = outputAudioContextRef.current;

      // Setup Visualizers
      inputAnalyserRef.current = inputCtx.createAnalyser();
      outputAnalyserRef.current = outputCtx.createAnalyser();
      inputAnalyserRef.current.fftSize = 256;
      outputAnalyserRef.current.fftSize = 256;

      // Setup Gains
      inputGainRef.current = inputCtx.createGain();
      outputGainRef.current = outputCtx.createGain();
      
      outputGainRef.current.connect(outputCtx.destination);
      // Connect output gain to analyser for visualization
      outputGainRef.current.connect(outputAnalyserRef.current);

      // Get Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const source = inputCtx.createMediaStreamSource(stream);
      source.connect(inputGainRef.current);
      inputGainRef.current.connect(inputAnalyserRef.current);

      // Setup Processor for streaming to Gemini
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      // We connect the analyser to the processor so we visualize what we send
      inputAnalyserRef.current.connect(processor);
      // Mute local output of microphone (avoid feedback)
      const muteGain = inputCtx.createGain();
      muteGain.gain.value = 0;
      processor.connect(muteGain);
      muteGain.connect(inputCtx.destination);

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `
        You are Natiq, a professional voice actor and conversational partner.
        
        Current Persona Settings:
        - Country: ${settings.country}
        - Dialect/Accent: ${settings.dialect}
        - Tone: ${settings.tone}
        - Gender: ${settings.gender}
        - Voice Persona: ${settings.voiceName}
        
        Instructions:
        1. Adopt the persona fully. Speak in the requested ${settings.dialect} (${settings.country}) dialect.
        2. Maintain the requested tone throughout the conversation.
        3. Keep responses concise and natural for a voice conversation.
        4. If the user speaks English, you can reply in English but keep the accent if possible, or reply in Arabic if appropriate for the persona.
        5. Be helpful and engaging.
        
        ${settings.country === Country.EGYPT ? `
        Special Instructions for Egypt:
        - Speak in authentic Egyptian Arabic (${settings.dialect}).
        - Maintain a friendly, expressive, and confident tone.
        - Use natural Egyptian idioms and cultural references appropriate for advertising, storytelling, or general conversation.
        - Avoid Modern Standard Arabic unless necessary.
        ` : ''}

        ${settings.country === Country.LIBYA ? `
        Special Instructions for Libya:
        - Use authentic Libyan Arabic dialect (Libyan Darja).
        - Use natural rhythm, commonly used Libyan expressions, and a friendly, persuasive tone.
        - Adapt your speech to Libyan culture, daily speech patterns, and local buying behavior.
        - Prioritize authentic Libyan dialect over Modern Standard Arabic.
        ` : ''}

        ${settings.country === Country.MOROCCO ? `
        Special Instructions for Morocco:
        - Use authentic Moroccan Arabic dialect (Moroccan Darija).
        - Use natural rhythm, commonly used Moroccan expressions, and a culturally appropriate tone.
        - Adapt your speech to Moroccan daily life and culture.
        - Prioritize authentic Darija over Modern Standard Arabic.
        ` : ''}
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: settings.voiceName } },
          },
          systemInstruction: systemInstruction,
        },
        callbacks: {
          onopen: () => {
            console.log('Session opened');
            setIsConnected(true);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              try {
                const ctx = outputAudioContextRef.current;
                if (!ctx) return;

                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                const audioBuffer = await decodeAudioData(
                  base64ToUint8Array(base64Audio),
                  ctx,
                  24000,
                  1
                );

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputGainRef.current!); // Connect to gain -> analyser -> dest
                
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              } catch (e) {
                console.error("Error decoding audio chunk", e);
              }
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              console.log('Interrupted');
              sourcesRef.current.forEach(source => {
                  try { source.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log('Session closed');
            cleanup();
          },
          onerror: (err) => {
            console.error('Session error', err);
            setError(t.connectionError);
            cleanup();
          }
        }
      });

      // Start processing audio from mic
      processor.onaudioprocess = (e) => {
        if (isMuted) return; // Don't send data if muted

        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(inputData);
        
        sessionPromise.then(session => {
          sessionRef.current = session;
          session.sendRealtimeInput({ media: pcmBlob });
        });
      };

    } catch (err: any) {
      console.error(err);
      setError(t.micError);
      cleanup();
    }
  };

  const toggleConnection = () => {
    if (isConnected) {
      cleanup();
    } else {
      connect();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
            </span>
            {t.liveTab}
        </h2>
        
        <div className="flex gap-2">
            {isConnected && (
                <button 
                    onClick={toggleMute}
                    className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}
                >
                    {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
            )}
            <button
                onClick={toggleConnection}
                className={`px-6 py-2 rounded-full font-semibold transition-all shadow-lg ${
                    isConnected 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
            >
                {isConnected ? t.endCall : t.startCall}
            </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center gap-8 min-h-[300px] bg-slate-900/50 rounded-xl p-8">
        {error && <div className="text-red-400 bg-red-900/20 px-4 py-2 rounded mb-4">{error}</div>}
        
        <div className="w-full max-w-md space-y-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{t.micInput}</p>
            <AudioVisualizer analyser={inputAnalyserRef.current} isActive={isConnected && !isMuted} barColor="#34d399" />
        </div>

        <div className="w-full max-w-md space-y-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{t.natiqOutput} ({settings.dialect})</p>
            <AudioVisualizer analyser={outputAnalyserRef.current} isActive={isConnected} barColor="#818cf8" />
        </div>

        {!isConnected && (
            <p className="text-slate-500 text-center max-w-sm">
                {t.liveInstructions}
            </p>
        )}
      </div>
    </div>
  );
};

export default LiveConversation;