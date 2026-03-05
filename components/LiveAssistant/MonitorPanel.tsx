import React from 'react';
import { ShieldCheck, Terminal, Zap, Info, History } from 'lucide-react';

interface MonitorPanelProps {
  logs: { type: 'action' | 'info', text: string }[];
}

export const MonitorPanel: React.FC<MonitorPanelProps> = ({ logs }) => {
  return (
    <div className="hidden lg:flex lg:col-span-3 space-y-6 flex-col h-[750px]">
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
    </div>
  );
};
