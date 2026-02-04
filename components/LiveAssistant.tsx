
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { 
  Mic, MicOff, Volume2, Waves, Zap, Search, Users, Home, 
  TrendingUp, ShieldCheck, Activity, MessageSquare, Terminal,
  Loader2, X, PhoneCall, Mail, ChevronRight, Info, SendHorizontal, CornerDownLeft,
  Sparkles, History, Command, Cpu, MessageCircle
} from 'lucide-react';
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

const COMMAND_CHIPS = [
  { icon: <Users size={16}/>, text: "Finn hotteste leads nå", color: "text-cyan-400" },
  { icon: <Home size={16}/>, text: "Vis boliger i Altea under 500k", color: "text-indigo-400" },
  { icon: <TrendingUp size={16}/>, text: "Analyser Benidorm markedet", color: "text-emerald-400" },
  { icon: <Mail size={16}/>, text: "Lag e-post utkast til Julian", color: "text-amber-400" }
];

const LiveAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<'Idle' | 'Listening' | 'Thinking' | 'Speaking'>('Idle');
  const [logs, setLogs] = useState<{ type: 'action' | 'info', text: string }[]>([]);
  const [transcription, setTranscription] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [textInput, setTextInput] = useState('');
  
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcription]);

  const addLog = (text: string, type: 'action' | 'info' = 'info') => {
    setLogs(prev => [{ type, text }, ...prev.slice(0, 19)]);
  };

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
  }, []);

  const startSession = async () => {
    if (isActive || isConnecting) return;
    try {
      setIsConnecting(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
                // Explicitly typed as any to allow assigning Lead array
                let result: any = "Data fetched.";
                // Fixed: Await the promise returned by getLeads() before calling slice.
                if (fc.name === 'get_leads') result = (await leadStore.getLeads()).slice(0, 5);
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
          responseModalalities: [Modality.AUDIO],
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
  };

  const handleSendText = async (e?: React.FormEvent | string) => {
    const msg = typeof e === 'string' ? e : textInput;
    if (typeof e !== 'string') e?.preventDefault();
    if (!msg.trim()) return;

    // Hvis ikke aktiv, start sesjon først
    if (!isActive) {
      addLog("Initializing Advisor via command...", "action");
      await startSession();
      // Vent litt på at isActive blir true (i en ekte app ville man ventet på session resolve)
    }

    setTextInput('');
    setTranscription(prev => [...prev.slice(-30), { role: 'user', text: msg }]);
    
    // Forsøk å sende
    if (sessionRef.current) {
      sessionRef.current.send({ parts: [{ text: msg }] });
      setStatus('Thinking');
    } else {
      // Hvis sesjonen fortsatt kobler til, vent og prøv igjen
      setTimeout(() => {
        if (sessionRef.current) {
          sessionRef.current.send({ parts: [{ text: msg }] });
          setStatus('Thinking');
        }
      }, 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-8 animate-in fade-in duration-700">
      
      {/* Main Grid: Chat Left, Logs Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* CHAT INTERFACE (9/12) */}
        <div className="lg:col-span-9 flex flex-col space-y-6">
          <div className="glass rounded-[3.5rem] border border-slate-800 overflow-hidden flex flex-col h-[750px] shadow-3xl relative bg-slate-950/20 backdrop-blur-2xl">
            
            {/* Header */}
            <header className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/40 backdrop-blur-md">
               <div className="flex items-center gap-5">
                  <div className={`w-4 h-4 rounded-full ${isActive ? 'bg-cyan-500 animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.8)]' : 'bg-slate-700'}`} />
                  <div>
                     <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Strategic AI Advisor</h2>
                     <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        {isActive ? <Cpu size={12} className="text-cyan-400" /> : <MicOff size={12} />} 
                        {isActive ? "Neural Core Synchronized" : "Ready for Command"}
                     </p>
                  </div>
               </div>

               <div className="flex items-center gap-6">
                  <div className="px-5 py-2 bg-slate-950 border border-slate-800 rounded-full flex items-center gap-3">
                     <div className={`w-2 h-2 rounded-full ${status === 'Speaking' ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                     <span className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-[0.2em]">{status}</span>
                  </div>
                  
                  <button
                    onClick={isActive ? stopSession : startSession}
                    disabled={isConnecting}
                    className={`p-4 rounded-[1.5rem] transition-all duration-300 shadow-xl ${
                      isActive 
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white' 
                        : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-cyan-500/20'
                    }`}
                  >
                    {isConnecting ? <Loader2 className="animate-spin" size={24} /> : isActive ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>
               </div>
            </header>

            {/* Message History */}
            <div className="flex-1 flex flex-col p-10 relative overflow-hidden">
               <div className={`absolute inset-0 bg-cyan-500/[0.03] blur-[150px] pointer-events-none transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />

               <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar mask-fade-top scroll-smooth py-4 relative z-10">
                  {transcription.length === 0 && !isActive && !isConnecting && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-30 grayscale group hover:grayscale-0 transition-all">
                       <div className="w-32 h-32 bg-slate-900 rounded-[3rem] border border-slate-800 flex items-center justify-center mx-auto shadow-inner">
                          {/* Fixed: MessageCircle icon imported above */}
                          <MessageCircle size={64} className="text-slate-700" />
                       </div>
                       <div className="max-w-sm mx-auto">
                          <h3 className="text-2xl font-bold text-slate-100">Klar til innsats</h3>
                          <p className="text-slate-500 text-sm mt-3 leading-relaxed">Skriv en instruks under eller bruk tale-knappen for å starte din personlige AI Advisor.</p>
                       </div>
                    </div>
                  )}
                  {transcription.map((t, i) => (
                    <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-6 duration-500`}>
                       <div className={`max-w-[80%] p-6 rounded-[2.5rem] text-[15px] leading-relaxed shadow-2xl border ${t.role === 'user' ? 'bg-slate-800 text-slate-200 border-slate-700 rounded-tr-none' : 'bg-cyan-500/5 text-cyan-400 border-cyan-500/10 rounded-tl-none'}`}>
                          {t.text}
                       </div>
                    </div>
                  ))}
                  {status === 'Thinking' && (
                    <div className="flex justify-start animate-pulse">
                       <div className="bg-slate-900/50 p-5 rounded-3xl border border-slate-800 flex items-center gap-4">
                          <Loader2 size={16} className="animate-spin text-cyan-500" />
                          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Processing Intelligence...</span>
                       </div>
                    </div>
                  )}
               </div>
            </div>

            {/* Input & Commands */}
            <footer className="p-10 border-t border-slate-800 bg-slate-900/60 backdrop-blur-xl space-y-8 relative z-10">
               
               {/* Quick Commands */}
               <div className="flex flex-wrap gap-3 justify-center">
                  {COMMAND_CHIPS.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendText(chip.text)}
                      className="px-6 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-bold text-slate-400 flex items-center gap-3 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-slate-900 transition-all active:scale-95 group shadow-lg"
                    >
                       <div className={`transition-transform group-hover:scale-110 ${chip.color}`}>{chip.icon}</div>
                       {chip.text}
                    </button>
                  ))}
               </div>

               {/* Text Input */}
               <form onSubmit={handleSendText} className="flex gap-5 relative group">
                  <div className="flex-1 relative">
                     <input 
                       type="text" 
                       value={textInput}
                       onChange={(e) => setTextInput(e.target.value)}
                       placeholder="Skriv instruks eller spørsmål her..."
                       className="w-full bg-slate-950/90 border-2 border-slate-800 rounded-[2.5rem] py-6 pl-10 pr-20 text-lg text-slate-100 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-800 shadow-3xl group-focus-within:shadow-cyan-500/5 group-focus-within:border-cyan-500/50"
                     />
                     <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em]">
                           <CornerDownLeft size={12} /> Enter
                        </div>
                     </div>
                  </div>
                  <button 
                   type="submit"
                   disabled={!textInput.trim() && !isConnecting}
                   className="p-6 bg-cyan-500 text-slate-950 rounded-[2.5rem] font-bold hover:bg-cyan-400 disabled:opacity-20 disabled:grayscale transition-all shadow-2xl shadow-cyan-500/20 active:scale-95 flex items-center justify-center min-w-[80px]"
                  >
                     {isConnecting ? <Loader2 className="animate-spin" /> : <SendHorizontal size={32} />}
                  </button>
               </form>
            </footer>
          </div>
        </div>

        {/* MONITOR PANEL (3/12) */}
        <div className="lg:col-span-3 space-y-6 flex flex-col h-[750px]">
           
           <div className="glass p-8 rounded-[3rem] border border-slate-800 flex items-center gap-5 shadow-xl bg-slate-900/20">
              <div className="w-16 h-16 rounded-[1.5rem] bg-slate-950 border border-slate-800 flex items-center justify-center shadow-lg">
                 <ShieldCheck className="text-cyan-500" size={32} />
              </div>
              <div className="overflow-hidden">
                 <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Security Link</p>
                 <p className="text-lg font-bold text-white truncate">ADVISOR-CORE</p>
              </div>
           </div>

           <div className="glass p-8 rounded-[3rem] border border-slate-800 flex-1 flex flex-col shadow-xl overflow-hidden bg-slate-900/10">
              <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                 <Terminal size={16} className="text-cyan-500" /> Executive Activity
              </h3>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                 {logs.length > 0 ? logs.map((log, i) => (
                   <div key={i} className={`p-4 rounded-2xl border text-[10px] font-mono flex items-start gap-4 animate-in slide-in-from-left duration-300 ${log.type === 'action' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-md' : 'bg-slate-950/50 border-slate-800 text-slate-600'}`}>
                      {log.type === 'action' ? <Zap size={14} className="mt-0.5 flex-shrink-0" /> : <Info size={14} className="mt-0.5 flex-shrink-0" />}
                      <span className="leading-relaxed">{log.text}</span>
                   </div>
                 )) : (
                   <div className="h-full flex flex-col items-center justify-center opacity-5 grayscale py-10">
                      <History size={48} />
                      <p className="text-[10px] mt-4 uppercase font-mono tracking-widest">Standby Mode</p>
                   </div>
                 )}
              </div>
           </div>

           <div className="p-8 bg-cyan-500/5 border border-cyan-500/10 rounded-[3rem] text-center shadow-inner">
              <Sparkles className="mx-auto text-cyan-500 mb-4 opacity-50" size={32} />
              <p className="text-[10px] font-bold text-cyan-400/60 uppercase tracking-[0.4em]">Encrypted Engine</p>
              <p className="text-[8px] text-slate-700 mt-2 uppercase tracking-widest leading-relaxed">V4.0 Real-time Multimodal Context</p>
           </div>

        </div>
      </div>

      <style>{`
        .mask-fade-top {
          mask-image: linear-gradient(to bottom, transparent, black 15%);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
        .shadow-3xl {
          box-shadow: 0 0 120px rgba(0,0,0,0.9);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default LiveAssistant;
