import React from 'react';
import { Cpu, Mic, MicOff, Loader2 } from 'lucide-react';

interface LiveAssistantHeaderProps {
  isActive: boolean;
  status: string;
  isConnecting: boolean;
  stopSession: () => void;
  startSession: () => void;
}

export const LiveAssistantHeader: React.FC<LiveAssistantHeaderProps> = ({ isActive, status, isConnecting, stopSession, startSession }) => {
  return (
    <header className="p-4 sm:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/40 backdrop-blur-md">
      <div className="flex items-center gap-3 sm:gap-5">
        <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 ${isActive ? 'bg-cyan-500 animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.8)]' : 'bg-slate-700'}`} />
        <div>
          <h2 className="text-base sm:text-2xl font-bold text-white uppercase tracking-tighter">Strategic AI Advisor</h2>
          <p className="text-[9px] sm:text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
            {isActive ? <Cpu size={10} className="text-cyan-400" /> : <MicOff size={10} />}
            {isActive ? "Tilkoblet" : "Klar"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        <div className="hidden sm:flex px-5 py-2 bg-slate-950 border border-slate-800 rounded-full items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${status === 'Speaking' ? 'bg-emerald-500' : 'bg-slate-800'}`} />
          <span className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-[0.2em]">{status}</span>
        </div>

        <button
          onClick={isActive ? stopSession : startSession}
          disabled={isConnecting}
          className={`p-3 sm:p-4 rounded-xl sm:rounded-[1.5rem] transition-all duration-300 shadow-xl ${
            isActive
              ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white'
              : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-cyan-500/20'
          }`}
        >
          {isConnecting ? <Loader2 className="animate-spin" size={20} /> : isActive ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
      </div>
    </header>
  );
};
