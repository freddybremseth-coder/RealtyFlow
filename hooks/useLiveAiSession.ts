import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { leadStore } from '../services/leadService';
import { propertyStore } from '../services/propertyService';
import { marketStore } from '../services/marketService';
import { settingsStore } from '../services/settingsService';

// --- Helper Functions for Audio ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Tool Declarations ---
const get_leads_tool: FunctionDeclaration = {
  name: 'get_leads',
  description: 'Henter en liste over alle leads i CRM-systemet.',
  parameters: { type: Type.OBJECT, properties: {} }
};

const get_properties_tool: FunctionDeclaration = {
  name: 'get_properties',
  description: 'Søker i eiendomsdatabasen.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: { type: Type.STRING },
      maxPrice: { type: Type.NUMBER }
    }
  }
};

export const useLiveAiSession = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<'Idle' | 'Listening' | 'Thinking' | 'Speaking'>('Idle');
  const [logs, setLogs] = useState<{ type: 'action' | 'info', text: string }[]>([]);
  const [transcription, setTranscription] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const addLog = useCallback((text: string, type: 'action' | 'info' = 'info') => {
    setLogs(prev => [{ type, text }, ...prev.slice(0, 19)]);
  }, []);

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.input.close();
      audioContextRef.current.output.close();
      audioContextRef.current = null;
    }
    setIsActive(false);
    setIsConnecting(false);
    setStatus('Idle');
    addLog("Session terminated", "info");
  }, [addLog]);

  const startSession = useCallback(async () => {
    if (isActive || isConnecting) return;
    try {
      setIsConnecting(true);
      const geminiKey = settingsStore.getApiKeys().gemini;
      if (!geminiKey) {
        addLog("Mangler Gemini API-nøkkel. Gå til Innstillinger → AI-nøkler.", "info");
        setIsConnecting(false);
        return;
      }
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const profile = settingsStore.getProfile();
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = { input: inputCtx, output: outputCtx };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            
            setIsActive(true);
            setIsConnecting(false);
            setStatus('Listening');
            addLog("Strategic Advisor Linked", "action");
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
              setStatus('Thinking');
              for (const fc of message.toolCall.functionCalls) {
                addLog(`Tool: ${fc.name}`, "action");
                let result: any = "Data fetched.";
                if (fc.name === 'get_leads') {
                  result = (await leadStore.getLeads()).slice(0, 5);
                } else if (fc.name === 'get_properties') {
                  let props = propertyStore.getProperties();
                  if (fc.args?.location) props = props.filter(p => p.location.toLowerCase().includes((fc.args.location as string).toLowerCase()));
                  if (fc.args?.maxPrice) props = props.filter(p => p.price <= (fc.args.maxPrice as number));
                  result = props.slice(0, 5).map(p => ({ title: p.title, location: p.location, price: p.price, bedrooms: p.bedrooms, area: p.area }));
                }
                const session = await sessionPromise;
                session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result } } });
              }
            }
            if (message.serverContent?.outputTranscription) {
               setTranscription(prev => [...prev.slice(-30), { role: 'ai', text: message.serverContent.outputTranscription.text }]);
            }
            if (message.serverContent?.inputTranscription) {
               setTranscription(prev => [...prev.slice(-30), { role: 'user', text: message.serverContent.inputTranscription.text }]);
            }
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setStatus('Speaking');
              const outCtx = audioContextRef.current?.output;
              if (outCtx) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
                const source = outCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outCtx.destination);
                source.onended = () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setStatus('Listening');
                };
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => { console.error(e); stopSession(); },
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          tools: [{ functionDeclarations: [get_leads_tool, get_properties_tool] }],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: `Du er RealtyFlow Strategic Advisor for ${profile.name}. Du hjelper med eiendomssalg og leads i Spania. Svar kort, profesjonelt og på norsk.`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  }, [isActive, isConnecting, addLog, stopSession]);

  const sendText = useCallback(async (msg: string) => {
    if (!msg.trim()) return;

    setTranscription(prev => [...prev.slice(-30), { role: 'user', text: msg }]);

    if (!sessionRef.current) {
      addLog("Initializing Advisor...", "action");
      await startSession();
      await new Promise<void>((resolve) => {
        let attempts = 0;
        const check = setInterval(() => {
          attempts++;
          if (sessionRef.current || attempts > 16) { clearInterval(check); resolve(); }
        }, 500);
      });
    }

    if (sessionRef.current) {
      try {
        sessionRef.current.sendClientContent({ turns: [{ role: 'user', parts: [{ text: msg }] }], turnComplete: true });
        setStatus('Thinking');
      } catch (err) {
        addLog("Feil ved sending. Prøv igjen.", "info");
      }
    } else {
      addLog("Sesjonen er ikke klar. Start med mikrofon-knappen.", "info");
    }
  }, [addLog, startSession]);

  return {
    isActive, 
    isConnecting, 
    status, 
    logs, 
    transcription, 
    startSession, 
    stopSession, 
    sendText 
  };
}; 
