import React from 'react';
import { Users, Home, TrendingUp, Mail } from 'lucide-react';

const COMMAND_CHIPS = [
  { icon: <Users size={16}/>, text: "Finn hotteste leads nå", color: "text-cyan-400" },
  { icon: <Home size={16}/>, text: "Vis boliger i Altea under 500k", color: "text-indigo-400" },
  { icon: <TrendingUp size={16}/>, text: "Analyser Benidorm markedet", color: "text-emerald-400" },
  { icon: <Mail size={16}/>, text: "Lag e-post utkast til Julian", color: "text-amber-400" }
];

interface CommandChipsProps {
  handleSendText: (text: string) => void;
}

export const CommandChips: React.FC<CommandChipsProps> = ({ handleSendText }) => {
  return (
    <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar sm:flex-wrap sm:justify-center pb-1">
      {COMMAND_CHIPS.map((chip, i) => (
        <button
          key={i}
          onClick={() => handleSendText(chip.text)}
          className="flex-shrink-0 px-3 sm:px-6 py-2 sm:py-3 bg-slate-950/80 border border-slate-800 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold text-slate-400 flex items-center gap-2 sm:gap-3 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-slate-900 transition-all active:scale-95 group shadow-lg"
        >
          <div className={`transition-transform group-hover:scale-110 ${chip.color}`}>{chip.icon}</div>
          <span className="hidden sm:inline">{chip.text}</span>
          <span className="sm:hidden">{chip.text.split(' ').slice(0, 2).join(' ')}</span>
        </button>
      ))}
    </div>
  );
};
