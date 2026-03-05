import React, { useRef, useEffect } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';

interface MessageHistoryProps {
  transcription: { role: 'user' | 'ai', text: string }[];
  status: string;
  isActive: boolean;
  isConnecting: boolean;
}

export const MessageHistory: React.FC<MessageHistoryProps> = ({ transcription, status, isActive, isConnecting }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcription]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pr-2 custom-scrollbar scroll-smooth py-2 sm:py-4 relative z-10">
      {transcription.length === 0 && !isActive && !isConnecting && (
        <div className="h-full flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8 opacity-30 grayscale group hover:grayscale-0 transition-all">
          <div className="w-20 h-20 sm:w-32 sm:h-32 bg-slate-900 rounded-3xl sm:rounded-[3rem] border border-slate-800 flex items-center justify-center mx-auto shadow-inner">
            <MessageCircle size={40} className="text-slate-700 sm:hidden" />
            <MessageCircle size={64} className="text-slate-700 hidden sm:block" />
          </div>
          <div className="max-w-sm mx-auto px-4">
            <h3 className="text-lg sm:text-2xl font-bold text-slate-100">Klar til innsats</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-2 sm:mt-3 leading-relaxed">Skriv en instruks under eller bruk tale-knappen for å starte din personlige AI Advisor.</p>
          </div>
        </div>
      )}
      {transcription.map((t, i) => (
        <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-6 duration-500`}>
          <div className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-6 rounded-2xl sm:rounded-[2.5rem] text-sm sm:text-[15px] leading-relaxed shadow-2xl border ${t.role === 'user' ? 'bg-slate-800 text-slate-200 border-slate-700 rounded-tr-none' : 'bg-cyan-500/5 text-cyan-400 border-cyan-500/10 rounded-tl-none'}`}>
            {t.text}
          </div>
        </div>
      ))}
      {status === 'Thinking' && (
        <div className="flex justify-start animate-pulse">
          <div className="bg-slate-900/50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-800 flex items-center gap-3 sm:gap-4">
            <Loader2 size={16} className="animate-spin text-cyan-500" />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Behandler...</span>
          </div>
        </div>
      )}
    </div>
  );
};
